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
        "taxa de servico",
        "taxa servico",
        "entrega",
        "diversos valor",
        "diversos",
        "acrescimo",
        "gorjeta",
        "desconto",
        "couvert",
    };

    public PdfParseResult Parse(byte[] pdfBytes)
    {
        var todasLinhas = new List<string>();

        using var document = PdfDocument.Open(pdfBytes);
        foreach (var page in document.GetPages())
        {
            var linhasPagina = ReconstruirLinhas(page);
            todasLinhas.AddRange(linhasPagina);
        }

        var hash = Convert.ToHexString(SHA256.HashData(pdfBytes)).ToLowerInvariant();
        var linhas = ParseLines(todasLinhas, out var periodoDe, out var periodoAte);

        return new PdfParseResult(periodoDe, periodoAte, hash, linhas);
    }

    // Correção 1: gap horizontal para distinguir colunas de palavras do mesmo token
    private static IReadOnlyList<string> ReconstruirLinhas(UglyToad.PdfPig.Content.Page page)
    {
        var words = page.GetWords().ToList();
        if (words.Count == 0) return Array.Empty<string>();

        // Tolerância: gap horizontal >= este valor indica nova coluna
        // Valor calibrado para o relatório PDV da Casa di Ana (colunas bem espaçadas)
        const double gapColuna = 8.0;

        var linhas = words
            .GroupBy(w => Math.Round(w.BoundingBox.Centroid.Y / 2.0) * 2)
            .OrderByDescending(g => g.Key)
            .Select(g =>
            {
                var palavras = g.OrderBy(w => w.BoundingBox.Left).ToList();
                var sb = new StringBuilder();
                for (int i = 0; i < palavras.Count; i++)
                {
                    if (i == 0)
                    {
                        sb.Append(palavras[i].Text);
                        continue;
                    }
                    // Gap entre fim da palavra anterior e início da atual
                    var gapHorizontal = palavras[i].BoundingBox.Left
                                      - palavras[i - 1].BoundingBox.Right;

                    // Gap grande = separador de coluna (duplo espaço)
                    // Gap pequeno = mesma expressão (espaço simples)
                    sb.Append(gapHorizontal >= gapColuna ? "  " : " ");
                    sb.Append(palavras[i].Text);
                }
                return sb.ToString();
            })
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .ToList();

        return linhas;
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

        // Correção 7: suporte a produtos com nome em duas linhas físicas
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
                    continue;
                }
            }

            if (IsPageHeader(linha)) continue;
            if (IsTotalLine(linha)) continue;

            if (IsSecaoHeader(linha))
            {
                linhaPendente = null;
                grupoAtual = linha.Trim();
                continue;
            }

            var linhaParaParsear = linhaPendente != null
                ? linhaPendente + " " + linha
                : linha;

            var parsed = TryParseProdutoLine(linhaParaParsear);

            if (parsed != null)
            {
                linhaPendente = null;
                if (!IsIgnorado(parsed.Value.Nome))
                {
                    resultado.Add(new LinhaRelatorio(
                        parsed.Value.Codigo,
                        parsed.Value.Nome,
                        string.IsNullOrEmpty(grupoAtual) ? null : grupoAtual,
                        parsed.Value.Quantidade,
                        parsed.Value.Valor));
                }
            }
            else
            {
                // Linha pendente: só guardar se não termina com número (seria linha incompleta de nome)
                linhaPendente = Regex.IsMatch(linha, @"[\d\.,]+$") ? null : linhaParaParsear;
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
            || (linha.Contains("Cód", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Qtd", StringComparison.OrdinalIgnoreCase))
            || (linha.Contains("Val. Unit", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Total Venda", StringComparison.OrdinalIgnoreCase))
            || (linha.Contains("Nome", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Tipo", StringComparison.OrdinalIgnoreCase)
                && linha.Contains("Preço", StringComparison.OrdinalIgnoreCase))
            || linha.StartsWith("Página", StringComparison.OrdinalIgnoreCase)
            || linha.StartsWith("Pág.", StringComparison.OrdinalIgnoreCase)
            || linha.StartsWith("Emitido", StringComparison.OrdinalIgnoreCase)
            // Correção 6: linhas "Padaria 14 registros", "Bar 57 registros" etc.
            || Regex.IsMatch(linha, @"^\S.*\d+\s+registro[s]?$", RegexOptions.IgnoreCase);
    }

    private static bool IsTotalLine(string linha)
    {
        var up = linha.ToUpperInvariant();
        return up.StartsWith("TOTAL")
            || up.StartsWith("SUB-TOTAL")
            || up.StartsWith("SUBTOTAL");
    }

    // Correção 4: regex aceita letras minúsculas para "Indefinido", "Bar", "Cozinha" etc.
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

    // Textos de forma de pagamento que aparecem em algumas linhas do relatório
    private static readonly HashSet<string> _formasPagamento = new(StringComparer.OrdinalIgnoreCase)
    {
        "a vista", "à vista", "vista", "a prazo", "crédito", "credito", "débito", "debito",
        "dinheiro", "pix", "cartão", "cartao", "voucher", "ticket", "convênio", "convenio",
        "ifood", "delivery",
        // Artigo isolado que sobra quando "A Vista" é separado em dois tokens pelo PDF
        "a", "à",
        // Correção 5: valor da coluna "Tipo" para itens como TAXA DE SERVIÇO
        "indefinido",
    };

    private static (string? Codigo, string Nome, decimal Quantidade, decimal Valor)?
        TryParseProdutoLine(string linha)
    {
        linha = Regex.Replace(linha, @"\bR\$\s*", "").Trim();

        var tokens = Regex.Split(linha, @"\s{2,}")
            .Select(t => t.Trim())
            .Where(t => !string.IsNullOrEmpty(t))
            .Where(t => !_formasPagamento.Contains(t))
            .ToList();

        // Correção 2: reagrupar tokens curtos não-numéricos que pertencem ao nome
        tokens = ReagruparTokensCurtos(tokens);

        if (tokens.Count < 2) return null;

        // Último token deve ser numérico (valor ou quantidade)
        if (!TryParseDecimalBR(tokens[^1], out var ultimoNum) || ultimoNum <= 0) return null;

        decimal qty;
        decimal valor;
        List<string> nameTokens;

        if (tokens.Count >= 4
            && TryParseDecimalBR(tokens[^3], out var precoUnit) && precoUnit > 0
            && TryParseDecimalBR(tokens[^2], out var qtd3) && qtd3 > 0)
        {
            // Formato real PDV: ... nome  val_unit  qtde  total — descarta val_unit
            qty = qtd3;
            valor = ultimoNum;
            nameTokens = tokens[..^3];
        }
        else if (tokens.Count >= 3 && TryParseDecimalBR(tokens[^2], out var penultimoNum) && penultimoNum > 0)
        {
            // Formato com qty e valor: ... nome  12,000  150,00
            qty = penultimoNum;
            valor = ultimoNum;
            nameTokens = tokens[..^2];
        }
        else
        {
            // Formato com apenas um número: ... nome  28,00
            qty = ultimoNum;
            valor = ultimoNum;
            nameTokens = tokens[..^1];
        }

        if (nameTokens.Count == 0) return null;

        // Correção 3: extrair e retornar o código do produto
        string? codigo = null;
        string nome;

        // Código numérico separado por duplo espaço: "001  Nome do Produto"
        if (Regex.IsMatch(nameTokens[0], @"^\d{1,6}$"))
        {
            codigo = nameTokens[0];
            nome = string.Join(" ", nameTokens.Skip(1)).Trim();
        }
        else
        {
            nome = string.Join(" ", nameTokens).Trim();
            // Código colado ao início do nome: "159Cissy - Croissant Casquinha"
            var mColado = Regex.Match(nome, @"^(\d{1,6})([A-Za-zÀ-ÖØ-öø-ÿ].*)$");
            if (mColado.Success)
            {
                codigo = mColado.Groups[1].Value;
                nome = mColado.Groups[2].Value.Trim();
            }
            else
            {
                // Código separado por espaço simples: "001 Nome"
                var m = Regex.Match(nome, @"^(\d{1,6})\s+(.+)$");
                if (m.Success)
                {
                    codigo = m.Groups[1].Value;
                    nome = m.Groups[2].Value.Trim();
                }
            }
        }

        if (string.IsNullOrWhiteSpace(nome) || nome.Length < 2) return null;

        return (codigo, nome, qty, valor);
    }

    // Correção 2: une tokens curtos não-numéricos ao token anterior
    // "de", "e", "c/", "-" etc. que viram tokens separados por falha do PdfPig
    private static List<string> ReagruparTokensCurtos(List<string> tokens)
    {
        if (tokens.Count <= 2) return tokens;

        var resultado = new List<string>();
        for (int i = 0; i < tokens.Count; i++)
        {
            var token = tokens[i];
            bool ehNumerico = TryParseDecimalBR(token, out _);
            bool ehCurtoNaoNumerico = !ehNumerico && token.Length <= 3;

            // Token curto não numérico com algo já no resultado: colar ao anterior
            if (ehCurtoNaoNumerico && resultado.Count > 0)
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
        return _ignorados.Contains(norm);
    }

    public static string Normalizar(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return string.Empty;

        var formD = s.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);
        foreach (var c in formD)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        return Regex.Replace(
            sb.ToString()
              .Normalize(NormalizationForm.FormC)
              .ToLowerInvariant()
              .Replace("-", " ")
              .Replace("/", " ")
              .Replace("(", "")
              .Replace(")", "")
              .Replace(".", ""),
            @"\s+", " ").Trim();
    }
}
