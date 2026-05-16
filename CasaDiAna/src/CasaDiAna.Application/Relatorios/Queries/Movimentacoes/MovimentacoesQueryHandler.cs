using CasaDiAna.Application.Relatorios.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.Movimentacoes;

public class MovimentacoesQueryHandler : IRequestHandler<MovimentacoesQuery, IReadOnlyList<MovimentacaoRelatorioDto>>
{
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly IIngredienteRepository _ingredientes;
    private readonly IUsuarioRepository _usuarios;

    public MovimentacoesQueryHandler(
        IMovimentacaoRepository movimentacoes,
        IIngredienteRepository ingredientes,
        IUsuarioRepository usuarios)
    {
        _movimentacoes = movimentacoes;
        _ingredientes = ingredientes;
        _usuarios = usuarios;
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

        var ingredienteIds = lista.Select(m => m.IngredienteId).Distinct().ToList();
        var ingredientesMap = new Dictionary<Guid, (string Nome, string Unidade)>();
        foreach (var id in ingredienteIds)
        {
            var ing = await _ingredientes.ObterPorIdAsync(id, cancellationToken);
            if (ing != null)
                ingredientesMap[id] = (ing.Nome, ing.UnidadeMedida?.Codigo ?? string.Empty);
        }

        var operadorIds = lista.Select(m => m.CriadoPor).Distinct().ToList();
        var operadoresMap = new Dictionary<Guid, string>();
        foreach (var id in operadorIds)
        {
            var u = await _usuarios.ObterPorIdAsync(id, cancellationToken);
            if (u != null)
                operadoresMap[id] = u.Nome;
        }

        return lista.Select(m =>
        {
            var (nome, unidade) = ingredientesMap.TryGetValue(m.IngredienteId, out var info)
                ? info
                : (string.Empty, string.Empty);

            operadoresMap.TryGetValue(m.CriadoPor, out var operadorNome);

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
                m.CriadoEm,
                operadorNome);
        }).ToList().AsReadOnly();
    }
}
