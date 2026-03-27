namespace CasaDiAna.Application.Entradas.Dtos;

public record EntradaMercadoriaResumoDto(
    Guid Id,
    string FornecedorNome,
    string? NumeroNotaFiscal,
    DateTime DataEntrada,
    string Status,
    int TotalItens,
    decimal CustoTotal,
    DateTime CriadoEm);
