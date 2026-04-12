namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public record ResultadoImportacaoDto(
    int TotalImportadas,
    int TotalIgnoradas,
    int TotalNaoEncontradas);
