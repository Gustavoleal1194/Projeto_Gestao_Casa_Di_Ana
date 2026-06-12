namespace CasaDiAna.Application.Despesas.Dtos;

public record CompraNotaDto(
    Guid EntradaId, string Fornecedor, string? NumeroNotaFiscal, DateTime Data, decimal Total);
