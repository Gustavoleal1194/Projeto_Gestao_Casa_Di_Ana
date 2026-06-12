namespace CasaDiAna.Application.Despesas.Dtos;

public record ComprasMesDto(
    DateTime Competencia, decimal TotalCompras, IReadOnlyList<CompraNotaDto> Itens);
