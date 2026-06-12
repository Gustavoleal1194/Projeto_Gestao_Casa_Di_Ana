using CasaDiAna.Application.Despesas.Dtos;

namespace CasaDiAna.Application.FechamentoMensal.Dtos;

public record FechamentoMensalDto(
    DateTime Competencia,
    decimal FaturamentoCalculado,
    decimal? FaturamentoManual,
    decimal FaturamentoUsado,
    decimal CustoDiretoTotal,
    decimal TotalDespesasFixas,
    decimal TotalDespesasVariaveis,
    decimal TotalCompras,
    decimal TotalSaidas,
    decimal FolhaPagamento,
    decimal? DespesaFixaPercentual,
    decimal MargemBruta,
    decimal MargemOperacional,
    decimal PrimeCost,
    IReadOnlyList<TotalCategoriaDto> DespesasPorCategoria);
