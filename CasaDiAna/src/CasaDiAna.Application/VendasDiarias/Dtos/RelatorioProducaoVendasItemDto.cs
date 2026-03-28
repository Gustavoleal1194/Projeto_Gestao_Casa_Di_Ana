namespace CasaDiAna.Application.VendasDiarias.Dtos;

public record RelatorioProducaoVendasItemDto(
    Guid ProdutoId,
    string ProdutoNome,
    decimal PrecoVenda,
    decimal TotalProduzido,
    decimal TotalVendido,
    decimal Perda,
    decimal CustoTotalProducao,
    decimal CustoMedioUnitario,
    decimal CustoPerda,
    decimal ReceitaEstimada,
    decimal? MargemLucro,
    decimal? MargemPerda);
