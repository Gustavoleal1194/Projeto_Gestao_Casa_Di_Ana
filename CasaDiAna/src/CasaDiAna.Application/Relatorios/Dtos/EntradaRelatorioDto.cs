namespace CasaDiAna.Application.Relatorios.Dtos;

public record EntradaRelatorioDto(
    Guid Id,
    string FornecedorNome,
    string? NumeroNotaFiscal,
    DateTime DataEntrada,
    string Status,
    int TotalItens,
    decimal CustoTotal);

public record EntradaRelatorioResumoDto(
    DateTime De,
    DateTime Ate,
    int TotalEntradas,
    int TotalEntradasConfirmadas,
    decimal CustoTotalConfirmadas,
    IReadOnlyList<EntradaRelatorioDto> Entradas);
