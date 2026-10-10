using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace CasaDiAna.Application.ImportacaoVendas.Services;

/// <summary>
/// Normaliza nomes do relatório e de produtos para comparação: sem acento,
/// minúsculo, sem pontuação de separação e com espaços colapsados.
/// </summary>
public static class NormalizadorNome
{
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
