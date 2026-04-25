namespace CasaDiAna.Application.Entradas.Dtos;

public record EntradaMercadoriaResumoDto(
    Guid Id,
    string FornecedorNome,
    string? NumeroNotaFiscal,
    DateTime DataEntrada,
    string Status,
    string? RecebidoPor,
    int TotalItens,
    decimal CustoTotal,
    DateTime CriadoEm);
