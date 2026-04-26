namespace CasaDiAna.Application.Relatorios.Dtos;

public record HistoricoPrecoDto(
    Guid EntradaId,
    string? NumeroNotaFiscal,
    DateTime DataEntrada,
    Guid FornecedorId,
    string FornecedorNome,
    decimal CustoUnitario,
    decimal Quantidade
);

public record PrecoFornecedorDto(
    Guid FornecedorId,
    string FornecedorNome,
    decimal PrecoMinimo,
    decimal PrecoMaximo,
    decimal PrecoMedio,
    decimal UltimoPreco,
    DateTime UltimaCompra,
    int TotalCompras
);

public record ComparacaoPrecoIngredienteDto(
    Guid IngredienteId,
    string IngredienteNome,
    string UnidadeMedidaCodigo,
    IReadOnlyList<HistoricoPrecoDto> Historico,
    IReadOnlyList<PrecoFornecedorDto> PorFornecedor,
    decimal? UltimoPreco,
    decimal? PrecoAnterior,
    decimal? VariacaoValor,
    decimal? VariacaoPercentual,
    string TendenciaPreco
);

public record ComparacaoPrecoDto(
    IReadOnlyList<ComparacaoPrecoIngredienteDto> Ingredientes,
    IReadOnlyList<ComparacaoPrecoIngredienteDto> MaioresAumentos,
    IReadOnlyList<ComparacaoPrecoIngredienteDto> MaioresReducoes
);
