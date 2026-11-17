using CasaDiAna.Application.Relatorios.Dtos;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.InsumosProducao;

/// <summary>
/// Insumos consumidos por produção, filtrados pela DATA DA PRODUÇÃO — não por quando
/// ela foi lançada. Uma produção de ontem registrada hoje de manhã conta em ontem.
/// </summary>
public class InsumosProducaoQueryHandler
    : IRequestHandler<InsumosProducaoQuery, IReadOnlyList<InsumoProducaoDiaDto>>
{
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly IIngredienteRepository _ingredientes;
    private readonly IProducaoDiariaRepository _producoesDiarias;

    public InsumosProducaoQueryHandler(
        IMovimentacaoRepository movimentacoes,
        IIngredienteRepository ingredientes,
        IProducaoDiariaRepository producoesDiarias)
    {
        _movimentacoes = movimentacoes;
        _ingredientes = ingredientes;
        _producoesDiarias = producoesDiarias;
    }

    public async Task<IReadOnlyList<InsumoProducaoDiaDto>> Handle(
        InsumosProducaoQuery request, CancellationToken cancellationToken)
    {
        var producoes = (await _producoesDiarias.ListarAsync(
                request.De, request.Ate, NuloSeVazio(request.ProdutoIds), cancellationToken))
            .ToDictionary(p => p.Id);

        var movs = (await _movimentacoes.ListarPorReferenciasAsync(
                TipoMovimentacao.SaidaProducao, producoes.Keys, cancellationToken))
            .AsEnumerable();

        if (request.IngredienteIds?.Count > 0)
            movs = movs.Where(m => request.IngredienteIds.Contains(m.IngredienteId));

        var movsDoPeriodo = movs.ToList();
        var ingredientes = await CarregarIngredientesAsync(
            movsDoPeriodo.Select(m => m.IngredienteId).Distinct(), cancellationToken);

        return movsDoPeriodo
            .Select(m =>
            {
                var producao = producoes[m.ReferenciaId!.Value];
                var (ingNome, ingUnidade) = ingredientes.GetValueOrDefault(m.IngredienteId, (string.Empty, string.Empty));
                return new InsumoProducaoDiaDto(
                    DateOnly.FromDateTime(producao.Data),
                    producao.Id,
                    producao.ProdutoId,
                    producao.Produto?.Nome ?? string.Empty,
                    m.IngredienteId,
                    ingNome,
                    ingUnidade,
                    m.Quantidade);
            })
            .OrderBy(r => r.Data)
            .ThenBy(r => r.ProdutoNome)
            .ThenBy(r => r.IngredienteNome)
            .ToList()
            .AsReadOnly();
    }

    private async Task<Dictionary<Guid, (string Nome, string Unidade)>> CarregarIngredientesAsync(
        IEnumerable<Guid> ids, CancellationToken ct)
    {
        var mapa = new Dictionary<Guid, (string Nome, string Unidade)>();
        foreach (var id in ids)
        {
            var ing = await _ingredientes.ObterPorIdAsync(id, ct);
            if (ing != null)
                mapa[id] = (ing.Nome, ing.UnidadeMedida?.Codigo ?? string.Empty);
        }
        return mapa;
    }

    private static IReadOnlyList<Guid>? NuloSeVazio(IReadOnlyList<Guid>? ids) =>
        ids is { Count: > 0 } ? ids : null;
}
