namespace CasaDiAna.Application.ImportacaoVendas.Services;

public interface IVendasParser
{
    VendasParseResult Parse(byte[] fileBytes);
}

public record VendasParseResult(
    string? PeriodoDe,
    string? PeriodoAte,
    string Hash,
    IReadOnlyList<LinhaRelatorio> Linhas);

public record LinhaRelatorio(
    string? CodigoExterno,
    string Nome,
    string? Grupo,
    decimal Quantidade,
    decimal ValorTotal);
