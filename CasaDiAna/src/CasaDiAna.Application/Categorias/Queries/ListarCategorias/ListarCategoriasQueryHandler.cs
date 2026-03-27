using CasaDiAna.Application.Categorias.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Categorias.Queries.ListarCategorias;

public class ListarCategoriasQueryHandler : IRequestHandler<ListarCategoriasQuery, IReadOnlyList<CategoriaDto>>
{
    private readonly ICategoriaIngredienteRepository _categorias;

    public ListarCategoriasQueryHandler(ICategoriaIngredienteRepository categorias) =>
        _categorias = categorias;

    public async Task<IReadOnlyList<CategoriaDto>> Handle(
        ListarCategoriasQuery request, CancellationToken cancellationToken)
    {
        var lista = await _categorias.ListarAsync(request.ApenasAtivos, cancellationToken);
        return lista
            .Select(c => new CategoriaDto(c.Id, c.Nome, c.Ativo, c.CriadoEm, c.AtualizadoEm))
            .ToList()
            .AsReadOnly();
    }
}
