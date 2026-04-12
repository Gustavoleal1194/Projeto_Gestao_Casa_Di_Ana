using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using CasaDiAna.Application.ImportacaoVendas.Services;

namespace CasaDiAna.Infrastructure.Services;

public class CsvVendasParser : IVendasParser
{
    public VendasParseResult Parse(byte[] fileBytes)
    {
        var hash = Convert.ToHexString(SHA256.HashData(fileBytes)).ToLowerInvariant();

        var text = Encoding.UTF8.GetString(fileBytes);
        if (text.StartsWith('\uFEFF'))
            text = text[1..];

        var linhas = text.Split(new[] { "\r\n", "\n", "\r" }, StringSplitOptions.None)
            .Skip(1)
            .Select(l => l.Trim())
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .ToList();

        var resultado = new List<LinhaRelatorio>();

        foreach (var linha in linhas)
        {
            var campos = linha.Split(';');
            if (campos.Length < 6) continue;

            var nome = campos[1].Trim();
            if (string.IsNullOrWhiteSpace(nome)) continue;
            if (IsIgnorado(nome)) continue;

            if (!TryParseDecimalBR(campos[4], out var qtde) || qtde <= 0) continue;
            if (!TryParseDecimalBR(campos[5], out var total)) continue;

            resultado.Add(new LinhaRelatorio(null, nome, null, qtde, total));
        }

        return new VendasParseResult(null, null, hash, resultado.AsReadOnly());
    }

    public static bool IsIgnorado(string nome)
    {
        var norm = Normalizar(nome);
        return norm.StartsWith("taxa") || norm.StartsWith("entrega");
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

    private static bool TryParseDecimalBR(string s, out decimal value)
        => decimal.TryParse(s.Trim(), NumberStyles.Any, new CultureInfo("pt-BR"), out value);
}
