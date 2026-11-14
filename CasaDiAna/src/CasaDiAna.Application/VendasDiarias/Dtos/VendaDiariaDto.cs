namespace CasaDiAna.Application.VendasDiarias.Dtos;

public record VendaDiariaDto(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
    DateTime Data,
    decimal QuantidadeVendida,
    /// <summary>Custo dos insumos baixados na venda (só produtos feitos na hora).</summary>
    decimal? CustoTotal,
    DateTime CriadoEm);
