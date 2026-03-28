using CasaDiAna.Application.Relatorios.Dtos;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.InsumosProducao;

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
        var movs = await _movimentacoes.ListarAsync(
            request.De, request.Ate, TipoMovimentacao.SaidaProducao, cancellationToken);

        // Opcional: filtrar por ingrediente
        if (request.IngredienteId.HasValue)
            movs = movs.Where(m => m.IngredienteId == request.IngredienteId.Value).ToList();

        // Carregar ProducoesDiarias referenciadas
        var producaoDiariaIds = movs
            .Where(m => m.ReferenciaId.HasValue)
            .Select(m => m.ReferenciaId!.Value)
            .Distinct()
            .ToList();

        var producoes = await _producoesDiarias.ListarPorIdsAsync(producaoDiariaIds, cancellationToken);
        var producoesMap = producoes.ToDictionary(p => p.Id);

        // Opcional: filtrar por produto
        if (request.ProdutoId.HasValue)
        {
            var prodFiltro = request.ProdutoId.Value;
            movs = movs
                .Where(m => m.ReferenciaId.HasValue
                    && producoesMap.TryGetValue(m.ReferenciaId.Value, out var pd)
                    && pd.ProdutoId == prodFiltro)
                .ToList();
        }

        // Carregar nomes dos ingredientes
        var ingredienteIds = movs.Select(m => m.IngredienteId).Distinct().ToList();
        var ingredientesMap = new Dictionary<Guid, (string Nome, string Unidade)>();
        foreach (var id in ingredienteIds)
        {
            var ing = await _ingredientes.ObterPorIdAsync(id, cancellationToken);
            if (ing != null)
                ingredientesMap[id] = (ing.Nome, ing.UnidadeMedida?.Codigo ?? string.Empty);
        }

        var resultado = new List<InsumoProducaoDiaDto>();
        foreach (var m in movs)
        {
            if (!m.ReferenciaId.HasValue || !producoesMap.TryGetValue(m.ReferenciaId.Value, out var producao))
                continue;

            var (ingNome, ingUnidade) = ingredientesMap.TryGetValue(m.IngredienteId, out var ing)
                ? ing
                : (string.Empty, string.Empty);

            resultado.Add(new InsumoProducaoDiaDto(
                DateOnly.FromDateTime(producao.Data),
                producao.Id,
                producao.ProdutoId,
                producao.Produto?.Nome ?? string.Empty,
                m.IngredienteId,
                ingNome,
                ingUnidade,
                m.Quantidade));
        }

        return resultado
            .OrderBy(r => r.Data)
            .ThenBy(r => r.ProdutoNome)
            .ThenBy(r => r.IngredienteNome)
            .ToList()
            .AsReadOnly();
    }
}
