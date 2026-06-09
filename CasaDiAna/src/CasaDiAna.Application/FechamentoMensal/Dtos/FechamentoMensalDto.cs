using CasaDiAna.Application.DespesasFixas.Dtos;

namespace CasaDiAna.Application.FechamentoMensal.Dtos;

public record FechamentoMensalDto(
    DateTime Competencia,
    decimal FaturamentoCalculado,
    decimal? FaturamentoManual,
    decimal FaturamentoUsado,
    decimal CustoDiretoTotal,
    decimal TotalDespesasFixas,
    decimal FolhaPagamento,
    decimal? DespesaFixaPercentual,
    decimal MargemBruta,
    decimal MargemOperacional,
    decimal PrimeCost,
    IReadOnlyList<TotalCategoriaDto> DespesasPorCategoria);
