using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using CasaDiAna.Application.ImportacaoVendas.Services;
using UglyToad.PdfPig;

namespace CasaDiAna.Infrastructure.Services;

public class PdfVendasParser : IPdfVendasParser
{
    private static readonly HashSet<string> _ignorados = new(StringComparer.OrdinalIgnoreCase)
    {
        "taxa de servico", "taxa servico", "entrega perto", "entrega longe",
        "entrega", "diversos valor", "diversos", "acrescimo", "gorjeta",
        "desconto", "couvert",
    };

    public PdfParseResult Parse(byte[] pdfBytes)
    {
        var todasLinhas = new List<string>();
        using var document = PdfDocument.Open(pdfBytes);
        foreach (var page in document.GetPages())
            todasLinhas.AddRange(ReconstruirLinhas(page));

        var hash = Convert.ToHexString(SHA256.HashData(pdfBytes)).ToLowerInvariant();
        var linhas = ParseLines(todasLinhas, out var periodoDe, out var periodoAte);
        return new PdfParseResult(periodoDe, periodoAte, hash, linhas);
    }

    // Reconstrói linhas unindo palavras com DUPLO ESPAÇO entre cada uma.
    // O duplo espaço é o separador de colunas usado pelo TryParseProdutoLine.
    private static IReadOnlyList<string> ReconstruirLinhas(UglyToad.PdfPig.Content.Page page)
    {
        var words = page.GetWords().ToList();
        if (words.Count == 0) return Array.Empty<string>();

        return words
            .GroupBy(w => Math.Round(w.BoundingBox.Centroid.Y / 2.0) * 2)
            .OrderByDescending(g => g.Key)
            .Select(g => string.Join("  ", g.OrderBy(w => w.BoundingBox.Left).Select(w => w.Text)))
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .ToList();
    }

    public static IReadOnlyList<LinhaRelatorio> ParseLines(
        IReadOnlyList<string> linhas,
        out string? periodoDe,
        out string? periodoAte)
    {
        periodoDe = null;
        periodoAte = null;
        var resultado = new List<LinhaRelatorio>();
        var grupoAtual = string.Empty;
        string? linhaPendente = null;

        foreach (var raw in linhas)
        {
            var linha = raw.Trim();
            if (string.IsNullOrWhiteSpace(linha)) continue;

            if (periodoDe == null)
            {
                var pm = PeriodoRegex.Match(linha);
                if (pm.Success)
                {
                    periodoDe = ParseDataBR(pm.Groups["de"].Value);
                    periodoAte = ParseDataBR(pm.Groups["ate"].Value);
                    linhaPendente = null;
                    continue;
                }
            }

            if (IsPageHeader(linha))    { linhaPendente = null; continue; }
            if (IsTotalLine(linha))     { linhaPendente = null; continue; }
            if (IsRegistrosLine(linha)) { linhaPendente = null; continue; }

            if (IsSecaoHeader(linha))
            {
                linhaPendente = null;
                grupoAtual = linha.Trim();
                continue;
            }

            // Suporte a nomes longos que quebram em duas linhas físicas no PDF
            var linhaParaParsear = linhaPendente != null
                ? linhaPendente + "  " + linha
                : linha;

            var parsed = TryParseProdutoLine(linhaParaParsear);

            if (parsed != null)
            {
                linhaPendente = null;
                if (!IsIgnorado(parsed.Value.Nome))
                {
                    resultado.Add(new LinhaRelatorio(
                        null,  // CodigoExterno sempre null — não é necessário no sistema
                        parsed.Value.Nome,
                        string.IsNullOrEmpty(grupoAtual) ? null : grupoAtual,
                        parsed.Value.Quantidade,
                        parsed.Value.Valor));
                }
            }
            else
            {
                // Guardar como pendente só se a linha não termina com número
                // (linhas que terminam com número são dados, não continuação de nome)
                linhaPendente = Regex.IsMatch(linha, @"[\d\.,]+\s*$")
                    ? null
                    : linhaParaParsear;
            }
        }

        return resultado.AsReadOnly();
    }

    private static readonly Regex PeriodoRegex = new(
        @"[Pp]er[ií]odo[:\s]+(?<de>\d{2}/\d{2}/\d{4})\s+[aà]\s+(?<ate>\d{2}/\d{2}/\d{4})",
        RegexOptions.Compiled);

    private static bool IsPageHeader(string linha)
    {
        return linha.Contains("MOVIMENTAÇÃO DE PRODUTOS", StringComparison.OrdinalIgnoreCase)
            || linha.Contains("SINTÉTICO", StringComparison.OrdinalIgnoreCase)
            || linha.Contains("Movimentação de Produtos", StringComparison.OrdinalIgnoreCase)
            || (linha.Contains("Val. Unit", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Total Venda", StringComparison.OrdinalIgnoreCase))
            || (linha.Contains("Cód", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Produto", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Nome", StringComparison.OrdinalIgnoreCase))
            || (linha.Contains("Nome", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Tipo", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Preço", StringComparison.OrdinalIgnoreCase))
            || linha.StartsWith("Página", StringComparison.OrdinalIgnoreCase)
            || linha.StartsWith("Pág.", StringComparison.OrdinalIgnoreCase)
            || linha.StartsWith("Emitido", StringComparison.OrdinalIgnoreCase)
            || linha.Contains("34.559.264/0001-00", StringComparison.OrdinalIgnoreCase)
            || linha.Contains("Casa di Ana", StringComparison.OrdinalIgnoreCase)
            || linha.Contains("Vereador Francisco", StringComparison.OrdinalIgnoreCase)
            || linha.Contains("Presidente Prudente", StringComparison.OrdinalIgnoreCase)
            || linha.Contains("9621-0061", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsTotalLine(string linha)
    {
        var up = linha.ToUpperInvariant().TrimStart();
        return up.StartsWith("TOTAL") || up.StartsWith("SUB-TOTAL") || up.StartsWith("SUBTOTAL");
    }

    // Linhas como "Padaria 14 registros", "Bar 57 registros", "Acréscimos 1 registro"
    private static bool IsRegistrosLine(string linha)
        => Regex.IsMatch(linha, @"\d+\s+registro[s]?\s*$", RegexOptions.IgnoreCase);

    // Aceita maiúsculas E minúsculas: "Bar", "Cozinha", "Indefinido", "PADARIA"
    private static readonly Regex SecaoRegex = new(
        @"^[A-Za-záàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ\s\-]+$",
        RegexOptions.Compiled);

    private static bool IsSecaoHeader(string linha)
    {
        var t = linha.Trim();
        return t.Length >= 2
            && t.Length <= 50
            && SecaoRegex.IsMatch(t)
            && !t.Any(char.IsDigit);
    }

    // Coluna "Tipo" do relatório PDV — remover estes tokens das linhas de produto
    private static readonly HashSet<string> _formasPagamento = new(StringComparer.OrdinalIgnoreCase)
    {
        "a vista", "à vista", "vista", "a prazo", "indefinido",
        "crédito", "credito", "débito", "debito",
        "dinheiro", "pix", "cartão", "cartao",
        "voucher", "ticket", "convênio", "convenio",
        "ifood", "delivery",
    };

    // Formato das colunas no PDF: Cód  Nome  Tipo  Val.Unit  Qtde  Total Venda
    // Após remover R$ e forma de pagamento, tokens restantes:
    //   [num_codigo]  [nome...]  [preco_unit]  [qtde]  [total]
    // O código numérico inicial é descartado — não é necessário no sistema.
    private static (string? Codigo, string Nome, decimal Quantidade, decimal Valor)?
        TryParseProdutoLine(string linha)
    {
        // 1. Remover "R$"
        linha = Regex.Replace(linha, @"R\$\s*", "").Trim();

        // 2. Split por 2+ espaços → colunas
        var tokens = Regex.Split(linha, @"\s{2,}")
            .Select(t => t.Trim())
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Where(t => !_formasPagamento.Contains(t))
            .ToList();

        // 3. Reagrupar tokens de 1-2 chars não-numéricos (preposições isoladas: "e", "a", "c/", "-")
        tokens = ReagruparTokensCurtos(tokens);

        if (tokens.Count < 2) return null;

        // 4. Último token deve ser numérico (Total Venda)
        if (!TryParseDecimalBR(tokens[^1], out var totalVenda) || totalVenda <= 0) return null;

        decimal qtde;
        List<string> nameTokens;

        // 5. Detectar formato: 3 números no final = [val_unit] [qtde] [total]
        //                       2 números no final = [qtde] [total]
        if (tokens.Count >= 4
            && TryParseDecimalBR(tokens[^3], out _)
            && TryParseDecimalBR(tokens[^2], out var qtde3) && qtde3 > 0)
        {
            qtde = qtde3;
            nameTokens = tokens[..^3];
        }
        else if (tokens.Count >= 3
            && TryParseDecimalBR(tokens[^2], out var qtde2) && qtde2 > 0)
        {
            qtde = qtde2;
            nameTokens = tokens[..^2];
        }
        else
        {
            qtde = totalVenda;
            nameTokens = tokens[..^1];
        }

        if (nameTokens.Count == 0) return null;

        // 6. Descartar código numérico do início (não é necessário no sistema)
        //    Casos: "65" separado, "159Cissy" colado, "65 Pao" com espaço simples
        string nome;
        if (Regex.IsMatch(nameTokens[0], @"^\d{1,6}$"))
        {
            // Token puramente numérico → descartar
            nome = string.Join(" ", nameTokens.Skip(1)).Trim();
        }
        else
        {
            nome = string.Join(" ", nameTokens).Trim();
            // Código colado: "189Brioche" → descartar os dígitos do início
            var mColado = Regex.Match(nome, @"^(\d{1,6})([A-Za-zÀ-ÖØ-öø-ÿ].*)$");
            if (mColado.Success)
                nome = mColado.Groups[2].Value.Trim();
            else
            {
                // Código com espaço simples: "65 Pao multigraos" → descartar os dígitos
                var mEspaco = Regex.Match(nome, @"^(\d{1,6})\s+(.+)$");
                if (mEspaco.Success)
                    nome = mEspaco.Groups[2].Value.Trim();
            }
        }

        if (string.IsNullOrWhiteSpace(nome) || nome.Length < 2) return null;

        return (null, nome, qtde, totalVenda);
    }

    // Une tokens de 1-2 chars não-numéricos ao token anterior.
    // Threshold de 2 (não 3) para não capturar palavras como "Pao", "Bar", "152".
    private static List<string> ReagruparTokensCurtos(List<string> tokens)
    {
        if (tokens.Count <= 2) return tokens;
        var resultado = new List<string>();
        foreach (var token in tokens)
        {
            bool ehNumerico = TryParseDecimalBR(token, out _);
            bool ehPreposicaoIsolada = !ehNumerico && token.Length <= 2;

            if (ehPreposicaoIsolada && resultado.Count > 0)
                resultado[^1] = resultado[^1] + " " + token;
            else
                resultado.Add(token);
        }
        return resultado;
    }

    private static bool TryParseDecimalBR(string s, out decimal value)
    {
        var n = s.Replace(".", "").Replace(",", ".");
        return decimal.TryParse(n, NumberStyles.Any, CultureInfo.InvariantCulture, out value);
    }

    private static string? ParseDataBR(string ddmmyyyy)
    {
        if (DateTime.TryParseExact(ddmmyyyy, "dd/MM/yyyy",
            CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return dt.ToString("yyyy-MM-dd");
        return null;
    }

    public static bool IsIgnorado(string nome)
    {
        var norm = Normalizar(nome);
        return _ignorados.Contains(norm)
            || norm.StartsWith("entrega")
            || norm.StartsWith("acrescimo")
            || norm.StartsWith("taxa");
    }

    public static string Normalizar(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return string.Empty;
        var formD = s.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);
        foreach (var c in formD)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        return Regex.Replace(
            sb.ToString().Normalize(NormalizationForm.FormC)
              .ToLowerInvariant()
              .Replace("-", " ").Replace("/", " ")
              .Replace("(", "").Replace(")", "").Replace(".", ""),
            @"\s+", " ").Trim();
    }
}
