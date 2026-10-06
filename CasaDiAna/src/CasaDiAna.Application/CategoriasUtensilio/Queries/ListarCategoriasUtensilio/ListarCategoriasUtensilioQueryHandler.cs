using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Queries.ListarCategoriasUtensilio;

public class ListarCategoriasUtensilioQueryHandler : IRequestHandler<ListarCategoriasUtensilioQuery, IReadOnlyList<CategoriaUtensilioDto>>
{
    private readonly ICategoriaUtensilioRepository _categorias;

    public ListarCategoriasUtensilioQueryHandler(ICategoriaUtensilioRepository categorias) =>
        _categorias = categorias;

    public async Task<IReadOnlyList<CategoriaUtensilioDto>> Handle(
        ListarCategoriasUtensilioQuery request, CancellationToken cancellationToken)
    {
        var lista = await _categorias.ListarAsync(request.ApenasAtivos, cancellationToken);
        return lista
            .Select(c => new CategoriaUtensilioDto(c.Id, c.Nome, c.Ativo, c.CriadoEm, c.AtualizadoEm))
            .ToList()
            .AsReadOnly();
    }
}
