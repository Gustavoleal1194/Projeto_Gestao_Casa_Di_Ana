using CasaDiAna.Application.VendasDiarias.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.VendasDiarias.Queries.RelatorioProducaoVendas;

public class RelatorioProducaoVendasQueryHandler
    : IRequestHandler<RelatorioProducaoVendasQuery, RelatorioProducaoVendasDto>
{
    private readonly IProducaoDiariaRepository _producoes;
    private readonly IVendaDiariaRepository _vendas;
    private readonly IProdutoRepository _produtos;

    public RelatorioProducaoVendasQueryHandler(
        IProducaoDiariaRepository producoes,
        IVendaDiariaRepository vendas,
        IProdutoRepository produtos)
    {
        _producoes = producoes;
        _vendas = vendas;
        _produtos = produtos;
    }

    public async Task<RelatorioProducaoVendasDto> Handle(
        RelatorioProducaoVendasQuery request, CancellationToken cancellationToken)
    {
        var producoes = await _producoes.ListarAsync(
            request.De, request.Ate, request.ProdutoIds, cancellationToken);

        var vendas = await _vendas.ListarAsync(
            request.De, request.Ate, request.ProdutoIds, cancellationToken);

        // Agrupa todos os IDs de produtos envolvidos no período
        var todosProdutoIds = producoes.Select(p => p.ProdutoId)
            .Union(vendas.Select(v => v.ProdutoId))
            .Distinct()
            .ToList();

        // Carrega os produtos com a ficha: preço de venda e custo de referência para quem não foi produzido
        var todosProdutos = (await _produtos.ListarComFichaAsync(apenasAtivos: false, cancellationToken))
            .Where(p => todosProdutoIds.Contains(p.Id))
            .ToDictionary(p => p.Id);

        // Agrupa produções e vendas por produto
        var producoesPorProduto = producoes.GroupBy(p => p.ProdutoId).ToDictionary(g => g.Key);
        var vendasPorProduto = vendas.GroupBy(v => v.ProdutoId).ToDictionary(g => g.Key);

        var itens = new List<RelatorioProducaoVendasItemDto>();

        foreach (var produtoId in todosProdutoIds)
        {
            todosProdutos.TryGetValue(produtoId, out var produto);
            var nomeProduto = produto?.Nome ?? "Produto removido";
            var precoVenda = produto?.PrecoVenda ?? 0;

            // Totais de produção: usa o CustoTotal armazenado no momento do registro
            var totalProduzido = producoesPorProduto.TryGetValue(produtoId, out var grupoProducao)
                ? grupoProducao.Sum(p => p.QuantidadeProduzida)
                : 0m;

            var custoTotalProducao = producoesPorProduto.TryGetValue(produtoId, out grupoProducao)
                ? grupoProducao.Sum(p => p.CustoTotal)
                : 0m;

            var totalVendido = vendasPorProduto.TryGetValue(produtoId, out var grupoVenda)
                ? grupoVenda.Sum(v => v.QuantidadeVendida)
                : 0m;

            // Perda: produzido - vendido (mínimo 0, pois venda pode ser maior por estoque anterior)
            var perda = Math.Max(0, totalProduzido - totalVendido);

            // Custo médio por unidade produzida no período. Sem produção (bebida de revenda,
            // ou item que só foi vendido), vale o custo atual da ficha técnica do produto.
            var custoMedioUnitario = totalProduzido > 0
                ? custoTotalProducao / totalProduzido
                : produto?.CalcularCustoFicha() ?? 0m;

            var custoPerda = perda * custoMedioUnitario;
            var receitaEstimada = totalVendido * precoVenda;

            // Margem de lucro por unidade: (preço - custo médio) / preço × 100.
            // null quando não há venda, preço ou custo: sem custo a margem é desconhecida,
            // e exibir 100% esconderia o produto sem ficha técnica.
            decimal? margemLucro = precoVenda > 0 && totalVendido > 0 && custoMedioUnitario > 0
                ? ((precoVenda - custoMedioUnitario) / precoVenda) * 100
                : null;

            // Margem de perda: custo da perda / custo total de produção × 100
            decimal? margemPerda = custoTotalProducao > 0
                ? (custoPerda / custoTotalProducao) * 100
                : null;

            itens.Add(new RelatorioProducaoVendasItemDto(
                produtoId,
                nomeProduto,
                precoVenda,
                totalProduzido,
                totalVendido,
                perda,
                custoTotalProducao,
                custoMedioUnitario,
                custoPerda,
                receitaEstimada,
                margemLucro,
                margemPerda));
        }

        return new RelatorioProducaoVendasDto(
            request.De,
            request.Ate,
            itens.OrderBy(i => i.ProdutoNome).ToList().AsReadOnly(),
            Resumir(itens));
    }

    /// <summary>
    /// Lucro = receita − custo das vendas (vendido × custo unitário) − custo da perda.
    /// Usa o custo das unidades vendidas, não o da produção inteira: o custo de produção
    /// já inclui as unidades perdidas, e subtraí-lo junto com a perda contaria a perda duas vezes.
    /// </summary>
    private static ResumoProducaoVendasDto Resumir(IReadOnlyCollection<RelatorioProducaoVendasItemDto> itens)
    {
        var vendidos = itens.Where(i => i.TotalVendido > 0).ToList();
        var comCusto = vendidos.Where(i => i.CustoMedioUnitario > 0).ToList();

        var receitaComCusto = comCusto.Sum(i => i.ReceitaEstimada);
        var custoVendas = comCusto.Sum(i => i.TotalVendido * i.CustoMedioUnitario);
        var custoPerda = itens.Sum(i => i.CustoPerda);
        var lucro = receitaComCusto - custoVendas - custoPerda;

        return new ResumoProducaoVendasDto(
            ReceitaTotal: itens.Sum(i => i.ReceitaEstimada),
            ReceitaComCusto: receitaComCusto,
            CustoVendas: custoVendas,
            CustoPerda: custoPerda,
            LucroEstimado: lucro,
            MargemGeral: receitaComCusto > 0 ? lucro / receitaComCusto * 100 : null,
            ProdutosVendidos: vendidos.Count,
            ProdutosVendidosComCusto: comCusto.Count);
    }
}
