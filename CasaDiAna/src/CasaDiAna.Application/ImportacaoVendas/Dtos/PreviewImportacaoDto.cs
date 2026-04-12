namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public record PreviewImportacaoDto(
    string Hash,
    string? PeriodoDe,
    string? PeriodoAte,
    int TotalLinhasParseadas,
    int TotalMatched,
    int TotalAmbiguous,
    int TotalUnmatched,
    int TotalIgnored,
    IReadOnlyList<ItemPreviewDto> Itens);
