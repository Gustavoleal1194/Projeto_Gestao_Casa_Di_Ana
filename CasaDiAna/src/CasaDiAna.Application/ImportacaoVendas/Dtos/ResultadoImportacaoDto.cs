namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public record ResultadoImportacaoDto(
    int TotalImportadas,
    int TotalIgnoradas,
    int TotalNaoEncontradas,
    decimal TotalTaxaServico,
    decimal TotalEntregas,
    /// <summary>Vendas de produtos feitos na hora que tiveram os insumos baixados.</summary>
    int TotalVendasComBaixaInsumos,
    /// <summary>Produtos feitos na hora sem ficha técnica: vendidos sem baixa de insumos.</summary>
    IReadOnlyList<string> ProdutosSemFicha);
