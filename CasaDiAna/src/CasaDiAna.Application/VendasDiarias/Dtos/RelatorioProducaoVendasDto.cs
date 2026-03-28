namespace CasaDiAna.Application.VendasDiarias.Dtos;

public record RelatorioProducaoVendasDto(
    DateTime De,
    DateTime Ate,
    IReadOnlyList<RelatorioProducaoVendasItemDto> Itens);
