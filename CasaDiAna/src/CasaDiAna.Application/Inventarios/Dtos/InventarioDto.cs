namespace CasaDiAna.Application.Inventarios.Dtos;

public record InventarioDto(
    Guid Id,
    DateTime DataRealizacao,
    string? Descricao,
    string Status,
    string? Observacoes,
    DateTime? FinalizadoEm,
    IReadOnlyList<ItemInventarioDto> Itens,
    DateTime CriadoEm);
