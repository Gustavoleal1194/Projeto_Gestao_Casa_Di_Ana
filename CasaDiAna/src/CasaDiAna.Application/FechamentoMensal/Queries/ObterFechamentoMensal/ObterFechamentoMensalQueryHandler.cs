using CasaDiAna.Application.Despesas.Dtos;
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
    private readonly IDespesaRepository _despesas;
    private readonly IFaturamentoMensalRepository _faturamento;
    private readonly IProdutoRepository _produtos;
    private readonly IEntradaMercadoriaRepository _entradas;
    private readonly IImportacaoVendasRepository _importacoes;

    public ObterFechamentoMensalQueryHandler(
        IVendaDiariaRepository vendas, IDespesaRepository despesas,
        IFaturamentoMensalRepository faturamento, IProdutoRepository produtos,
        IEntradaMercadoriaRepository entradas, IImportacaoVendasRepository importacoes)
    {
        _vendas = vendas;
        _despesas = despesas;
        _faturamento = faturamento;
        _produtos = produtos;
        _entradas = entradas;
        _importacoes = importacoes;
    }

    public async Task<FechamentoMensalDto> Handle(
        ObterFechamentoMensalQuery request, CancellationToken cancellationToken)
    {
        var competencia = Despesa.NormalizarCompetencia(request.Competencia);
        var inicio = competencia;
        var fim = competencia.AddMonths(1).AddDays(-1);

        var vendas = await _vendas.ListarAsync(inicio, fim, null, cancellationToken);
        var produtos = (await _produtos.ListarComFichaAsync(false, cancellationToken)).ToDictionary(p => p.Id);

        decimal faturamentoCalculado = 0m, custoDiretoTotal = 0m;
        foreach (var venda in vendas)
        {
            if (!produtos.TryGetValue(venda.ProdutoId, out var produto)) continue;
            faturamentoCalculado += venda.QuantidadeVendida * produto.PrecoVenda;
            custoDiretoTotal += venda.QuantidadeVendida * produto.CalcularCustoFicha();
        }

        var faturamentoManual = (await _faturamento.ObterPorCompetenciaAsync(competencia, cancellationToken))?.ValorManual;
        var faturamentoUsado = faturamentoManual ?? faturamentoCalculado;

        // Taxa de serviço e entregas entram no caixa e são repassadas; o faturamento
        // manual substitui só a receita de produtos.
        var importacoes = await _importacoes.ListarPorDataVendaAsync(
            competencia, competencia.AddMonths(1), cancellationToken);
        var receitaTaxaServico = importacoes.Sum(i => i.TotalTaxaServico);
        var receitaEntregas = importacoes.Sum(i => i.TotalEntregas);
        var repasseEquipe = importacoes.Sum(i => i.RepasseEquipe);
        var repasseMotoboys = importacoes.Sum(i => i.RepasseMotoboys);
        var totalRepasses = repasseEquipe + repasseMotoboys;
        var receitaTotal = faturamentoUsado + receitaTaxaServico + receitaEntregas;
        var receitaLiquida = receitaTotal - totalRepasses;

        var despesas = await _despesas.ListarPorCompetenciaAsync(competencia, cancellationToken);
        var totalFixas = despesas.Where(d => d.Categoria!.Tipo == TipoDespesa.Fixa).Sum(d => d.Valor);
        var totalVariaveis = despesas.Where(d => d.Categoria!.Tipo == TipoDespesa.Variavel).Sum(d => d.Valor);
        var folha = despesas.Where(d => d.Categoria!.EhFolhaPagamento).Sum(d => d.Valor);
        var porCategoria = despesas
            .GroupBy(d => new { d.CategoriaDespesaId, d.Categoria!.Nome })
            .Select(g => new TotalCategoriaDto(g.Key.CategoriaDespesaId, g.Key.Nome, g.Sum(d => d.Valor)))
            .OrderBy(c => c.CategoriaNome)
            .ToList();

        var entradas = await _entradas.ListarAsync(inicio, fim, cancellationToken);
        var totalCompras = entradas
            .Where(e => e.Status == StatusEntrada.Confirmada)
            .Sum(e => e.CustoTotal);

        var totalSaidas = totalFixas + totalVariaveis + totalCompras + totalRepasses;
        decimal? despesaFixaPercentual = receitaLiquida > 0 ? totalFixas / receitaLiquida : null;
        var margemBruta = receitaLiquida - custoDiretoTotal;
        var margemOperacional = receitaLiquida - custoDiretoTotal - totalFixas - totalVariaveis;
        var primeCost = custoDiretoTotal + folha;

        return new FechamentoMensalDto(
            competencia, faturamentoCalculado, faturamentoManual, faturamentoUsado, custoDiretoTotal,
            totalFixas, totalVariaveis, totalCompras, totalSaidas, folha,
            despesaFixaPercentual, margemBruta, margemOperacional, primeCost, porCategoria,
            receitaTaxaServico, receitaEntregas, receitaTotal,
            repasseEquipe, repasseMotoboys, totalRepasses, receitaLiquida);
    }
}
