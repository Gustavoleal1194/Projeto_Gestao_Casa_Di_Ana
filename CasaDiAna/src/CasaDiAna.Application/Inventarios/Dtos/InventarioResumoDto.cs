namespace CasaDiAna.Application.Inventarios.Dtos;

public record InventarioResumoDto(
    Guid Id,
    DateTime DataRealizacao,
    string? Descricao,
    string Status,
    int TotalItens,
    DateTime CriadoEm);
