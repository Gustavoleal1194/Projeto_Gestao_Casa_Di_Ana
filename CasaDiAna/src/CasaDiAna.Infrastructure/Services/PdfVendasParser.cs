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
                grupoAtual = linha.Trim();
                continue;
            }

            var parsed = TryParseProdutoLine(linha);
            if (parsed == null) continue;

            resultado.Add(new LinhaRelatorio(
                parsed.Value.Codigo,
                parsed.Value.Nome,
                string.IsNullOrEmpty(grupoAtual) ? null : grupoAtual,
                parsed.Value.Quantidade,
                parsed.Value.Valor));
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
            || linha.StartsWith("Emitido", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsTotalLine(string linha)
    {
        var up = linha.ToUpperInvariant();
        return up.StartsWith("TOTAL")
            || up.StartsWith("SUB-TOTAL")
            || up.StartsWith("SUBTOTAL");
    }

    private static readonly Regex SecaoRegex = new(
        @"^[A-ZÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ\s\-]+$",
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
    };

    private static (string? Codigo, string Nome, decimal Quantidade, decimal Valor)?
        TryParseProdutoLine(string linha)
    {
        linha = Regex.Replace(linha, @"\bR\$\s*", "").Trim();

        var tokens = Regex.Split(linha, @"\s{2,}")
            .Select(t => t.Trim())
            .Where(t => !string.IsNullOrEmpty(t))
            // Remove tokens de forma de pagamento antes de parsear colunas
            .Where(t => !_formasPagamento.Contains(t))
            .ToList();

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
            // Formato com apenas um número: ... nome  28,00  → usar como quantidade
            qty = ultimoNum;
            valor = ultimoNum;
            nameTokens = tokens[..^1];
        }

        if (nameTokens.Count == 0) return null;

        string nome;

        // Código numérico separado: "001  Nome do Produto"
        if (Regex.IsMatch(nameTokens[0], @"^\d{1,6}$"))
        {
            nome = string.Join(" ", nameTokens.Skip(1)).Trim();
        }
        else
        {
            nome = string.Join(" ", nameTokens).Trim();
            // Código colado ao início do nome: "159Cissy - Croissant Casquinha"
            var mColado = Regex.Match(nome, @"^(\d{1,6})([A-Za-zÀ-ÖØ-öø-ÿ].*)$");
            if (mColado.Success)
                nome = mColado.Groups[2].Value.Trim();
            else
            {
                // Código separado por espaço simples: "001 Nome"
                var m = Regex.Match(nome, @"^(\d{1,6})\s+(.+)$");
                if (m.Success)
                    nome = m.Groups[2].Value.Trim();
            }
        }

        if (string.IsNullOrWhiteSpace(nome) || nome.Length < 2) return null;

        return (null, nome, qty, valor);
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
