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
        IReadOnlyList<Guid>? produtoIdsFiltro = request.ProdutoId.HasValue
            ? new[] { request.ProdutoId.Value }
            : null;

        var producoes = await _producoes.ListarAsync(
            request.De, request.Ate, produtoIdsFiltro, cancellationToken);

        var vendas = await _vendas.ListarAsync(
            request.De, request.Ate, produtoIdsFiltro, cancellationToken);

        // Agrupa todos os IDs de produtos envolvidos no período
        var todosProdutoIds = producoes.Select(p => p.ProdutoId)
            .Union(vendas.Select(v => v.ProdutoId))
            .Distinct()
            .ToList();

        // Carrega detalhes dos produtos (preço de venda)
        var todosProdutos = (await _produtos.ListarAsync(apenasAtivos: false, cancellationToken))
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

            // Custo médio por unidade produzida no período
            var custoMedioUnitario = totalProduzido > 0
                ? custoTotalProducao / totalProduzido
                : 0m;

            var custoPerda = perda * custoMedioUnitario;
            var receitaEstimada = totalVendido * precoVenda;

            // Margem de lucro por unidade: (preço - custo médio) / preço × 100
            // Quando não há custo (sem produção ou sem ficha técnica), mas há vendas,
            // toda a receita é lucro → margem 100%. null só quando não há venda ou preço.
            decimal? margemLucro = precoVenda > 0 && totalVendido > 0
                ? custoMedioUnitario > 0
                    ? ((precoVenda - custoMedioUnitario) / precoVenda) * 100
                    : 100m
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
            itens.OrderBy(i => i.ProdutoNome).ToList().AsReadOnly());
    }
}
