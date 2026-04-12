namespace CasaDiAna.Application.ImportacaoVendas.Services;

public interface IPdfVendasParser
{
    PdfParseResult Parse(byte[] pdfBytes);
}

public record PdfParseResult(
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
