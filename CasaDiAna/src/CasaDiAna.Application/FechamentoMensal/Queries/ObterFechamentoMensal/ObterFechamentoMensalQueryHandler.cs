using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;

public class ObterFechamentoMensalQueryHandler
    : IRequestHandler<ObterFechamentoMensalQuery, FechamentoMensalDto>
{
    private readonly IVendaDiariaRepository _vendas;
    private readonly IDespesaFixaRepository _despesas;
    private readonly IFaturamentoMensalRepository _faturamento;
    private readonly IProdutoRepository _produtos;

    public ObterFechamentoMensalQueryHandler(
        IVendaDiariaRepository vendas,
        IDespesaFixaRepository despesas,
        IFaturamentoMensalRepository faturamento,
        IProdutoRepository produtos)
    {
        _vendas = vendas;
        _despesas = despesas;
        _faturamento = faturamento;
        _produtos = produtos;
    }

    public async Task<FechamentoMensalDto> Handle(
        ObterFechamentoMensalQuery request, CancellationToken cancellationToken)
    {
        var competencia = DespesaFixa.NormalizarCompetencia(request.Competencia);
        var inicio = competencia;
        var fim = competencia.AddMonths(1).AddDays(-1);

        var vendas = await _vendas.ListarAsync(inicio, fim, null, cancellationToken);
        var produtos = (await _produtos.ListarComFichaAsync(false, cancellationToken))
            .ToDictionary(p => p.Id);

        decimal faturamentoCalculado = 0m;
        decimal custoDiretoTotal = 0m;
        foreach (var venda in vendas)
        {
            if (!produtos.TryGetValue(venda.ProdutoId, out var produto))
                continue;
            faturamentoCalculado += venda.QuantidadeVendida * produto.PrecoVenda;
            custoDiretoTotal += venda.QuantidadeVendida * produto.CalcularCustoFicha();
        }

        var faturamentoManual = (await _faturamento.ObterPorCompetenciaAsync(competencia, cancellationToken))?.ValorManual;
        var faturamentoUsado = faturamentoManual ?? faturamentoCalculado;

        var despesas = await _despesas.ListarPorCompetenciaAsync(competencia, cancellationToken);
        var totalDespesas = despesas.Sum(d => d.Valor);
        var folha = despesas.Where(d => d.Categoria == CategoriaDespesaFixa.FolhaPagamento).Sum(d => d.Valor);
        var porCategoria = despesas
            .GroupBy(d => d.Categoria)
            .Select(g => new TotalCategoriaDto(g.Key, g.Sum(d => d.Valor)))
            .OrderBy(c => c.Categoria)
            .ToList();

        decimal? despesaFixaPercentual = faturamentoUsado > 0 ? totalDespesas / faturamentoUsado : null;
        var margemBruta = faturamentoUsado - custoDiretoTotal;
        var margemOperacional = faturamentoUsado - custoDiretoTotal - totalDespesas;
        var primeCost = custoDiretoTotal + folha;

        return new FechamentoMensalDto(
            competencia,
            faturamentoCalculado,
            faturamentoManual,
            faturamentoUsado,
            custoDiretoTotal,
            totalDespesas,
            folha,
            despesaFixaPercentual,
            margemBruta,
            margemOperacional,
            primeCost,
            porCategoria);
    }
}
