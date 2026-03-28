namespace CasaDiAna.Application.VendasDiarias.Dtos;

public record VendaDiariaDto(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
    DateTime Data,
    decimal QuantidadeVendida,
    DateTime CriadoEm);
