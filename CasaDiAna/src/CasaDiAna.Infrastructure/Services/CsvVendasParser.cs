using System.Globalization;
using System.Security.Cryptography;
using System.Text;
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

            if (!TryParseDecimalBR(campos[4], out var qtde) || qtde <= 0) continue;
            if (!TryParseDecimalBR(campos[5], out var total)) continue;

            resultado.Add(new LinhaRelatorio(null, nome, null, qtde, total));
        }

        return new VendasParseResult(null, null, hash, resultado.AsReadOnly());
    }

    private static bool TryParseDecimalBR(string s, out decimal value)
        => decimal.TryParse(s.Trim(), NumberStyles.Any, new CultureInfo("pt-BR"), out value);
}
