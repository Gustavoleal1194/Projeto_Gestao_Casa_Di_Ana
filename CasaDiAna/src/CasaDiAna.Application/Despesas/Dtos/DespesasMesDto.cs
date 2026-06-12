namespace CasaDiAna.Application.Despesas.Dtos;

public record DespesasMesDto(
    DateTime Competencia,
    decimal TotalFixas,
    decimal TotalVariaveis,
    IReadOnlyList<DespesaDto> Itens,
    IReadOnlyList<TotalCategoriaDto> TotalPorCategoria);
