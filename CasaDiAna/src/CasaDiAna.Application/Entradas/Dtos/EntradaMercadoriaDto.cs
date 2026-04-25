namespace CasaDiAna.Application.Entradas.Dtos;

public record EntradaMercadoriaDto(
    Guid Id,
    Guid FornecedorId,
    string FornecedorNome,
    string? NumeroNotaFiscal,
    DateTime DataEntrada,
    string Status,
    string? RecebidoPor,
    string? Observacoes,
    IReadOnlyList<ItemEntradaDto> Itens,
    decimal CustoTotal,
    DateTime CriadoEm);
