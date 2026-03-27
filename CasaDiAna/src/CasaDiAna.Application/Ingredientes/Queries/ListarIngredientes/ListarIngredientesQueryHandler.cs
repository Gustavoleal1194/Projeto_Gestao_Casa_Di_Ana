using CasaDiAna.Application.Ingredientes.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Queries.ListarIngredientes;

public class ListarIngredientesQueryHandler
    : IRequestHandler<ListarIngredientesQuery, IReadOnlyList<IngredienteResumoDto>>
{
    private readonly IIngredienteRepository _ingredientes;

    public ListarIngredientesQueryHandler(IIngredienteRepository ingredientes) =>
        _ingredientes = ingredientes;

    public async Task<IReadOnlyList<IngredienteResumoDto>> Handle(
        ListarIngredientesQuery request, CancellationToken cancellationToken)
    {
        var lista = await _ingredientes.ListarAsync(request.ApenasAtivos, cancellationToken);
        return lista
            .Select(i => new IngredienteResumoDto(
                i.Id, i.Nome, i.CodigoInterno,
                i.Categoria?.Nome,
                i.UnidadeMedida?.Codigo ?? string.Empty,
                i.EstoqueAtual, i.EstoqueMinimo,
                i.EstaBaixoDoMinimo(), i.Ativo))
            .ToList()
            .AsReadOnly();
    }
}
