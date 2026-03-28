namespace CasaDiAna.Application.ProducaoDiaria.Dtos;

public record ProducaoDiariaDto(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
    DateTime Data,
    decimal QuantidadeProduzida,
    decimal CustoTotal,
    string? Observacoes,
    DateTime CriadoEm);
