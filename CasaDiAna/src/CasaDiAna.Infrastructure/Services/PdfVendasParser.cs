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

    private static (string? Codigo, string Nome, decimal Quantidade, decimal Valor)?
        TryParseProdutoLine(string linha)
    {
        linha = Regex.Replace(linha, @"\bR\$\s*", "").Trim();

        var tokens = Regex.Split(linha, @"\s{2,}")
            .Select(t => t.Trim())
            .Where(t => !string.IsNullOrEmpty(t))
            .ToList();

        if (tokens.Count < 2) return null;

        if (!TryParseDecimalBR(tokens[^1], out var valor) || valor <= 0) return null;
        if (!TryParseDecimalBR(tokens[^2], out var qty) || qty <= 0) return null;

        var nameTokens = tokens[..^2];
        if (nameTokens.Count == 0) return null;

        string? codigo = null;
        string nome;

        if (Regex.IsMatch(nameTokens[0], @"^\d{1,6}$"))
        {
            codigo = nameTokens[0];
            nome = string.Join(" ", nameTokens.Skip(1)).Trim();
        }
        else
        {
            nome = string.Join(" ", nameTokens).Trim();
            var m = Regex.Match(nome, @"^(\d{1,6})\s+(.+)$");
            if (m.Success)
            {
                codigo = m.Groups[1].Value;
                nome = m.Groups[2].Value.Trim();
            }
        }

        if (string.IsNullOrWhiteSpace(nome) || nome.Length < 2) return null;

        return (codigo, nome, qty, valor);
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
