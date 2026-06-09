namespace CasaDiAna.Application.DespesasFixas.Dtos;

public record DespesasFixasMesDto(
    DateTime Competencia,
    decimal Total,
    IReadOnlyList<DespesaFixaDto> Itens,
    IReadOnlyList<TotalCategoriaDto> TotalPorCategoria);
