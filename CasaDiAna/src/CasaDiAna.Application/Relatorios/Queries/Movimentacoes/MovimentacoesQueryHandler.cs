using CasaDiAna.Application.Relatorios.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.Movimentacoes;

public class MovimentacoesQueryHandler : IRequestHandler<MovimentacoesQuery, IReadOnlyList<MovimentacaoRelatorioDto>>
{
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly IIngredienteRepository _ingredientes;

    public MovimentacoesQueryHandler(
        IMovimentacaoRepository movimentacoes,
        IIngredienteRepository ingredientes)
    {
        _movimentacoes = movimentacoes;
        _ingredientes = ingredientes;
    }

    public async Task<IReadOnlyList<MovimentacaoRelatorioDto>> Handle(
        MovimentacoesQuery request, CancellationToken cancellationToken)
    {
        var lista = (await _movimentacoes.ListarAsync(
            request.De, request.Ate, null, cancellationToken)).ToList();

        if (request.Tipos?.Length > 0)
            lista = lista.Where(m => request.Tipos.Contains(m.Tipo)).ToList();

        if (request.IngredienteIds?.Count > 0)
            lista = lista.Where(m => request.IngredienteIds.Contains(m.IngredienteId)).ToList();

        // Carrega nomes dos ingredientes
        var ingredienteIds = lista.Select(m => m.IngredienteId).Distinct().ToList();
        var ingredientesMap = new Dictionary<Guid, (string Nome, string Unidade)>();
        foreach (var id in ingredienteIds)
        {
            var ing = await _ingredientes.ObterPorIdAsync(id, cancellationToken);
            if (ing != null)
                ingredientesMap[id] = (ing.Nome, ing.UnidadeMedida?.Codigo ?? string.Empty);
        }

        return lista.Select(m =>
        {
            var (nome, unidade) = ingredientesMap.TryGetValue(m.IngredienteId, out var info)
                ? info
                : (string.Empty, string.Empty);

            return new MovimentacaoRelatorioDto(
                m.Id,
                m.IngredienteId,
                nome,
                unidade,
                m.Tipo.ToString(),
                m.Quantidade,
                m.SaldoApos,
                m.ReferenciaTipo,
                m.ReferenciaId,
                m.CriadoEm);
        }).ToList().AsReadOnly();
    }
}
