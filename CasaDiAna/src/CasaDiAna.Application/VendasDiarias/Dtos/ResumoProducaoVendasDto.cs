namespace CasaDiAna.Application.VendasDiarias.Dtos;

/// <summary>
/// Totais do período. Lucro e margem consideram só os produtos vendidos com custo conhecido:
/// somar a receita de quem não tem ficha técnica, com custo zero, inflaria a margem.
/// </summary>
public record ResumoProducaoVendasDto(
    decimal ReceitaTotal,
    decimal ReceitaComCusto,
    decimal CustoVendas,
    decimal CustoPerda,
    decimal LucroEstimado,
    decimal? MargemGeral,
    int ProdutosVendidos,
    int ProdutosVendidosComCusto);
