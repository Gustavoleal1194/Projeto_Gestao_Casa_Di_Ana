using CasaDiAna.Application.Inventarios.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Queries.ListarInventarios;

public class ListarInventariosQueryHandler : IRequestHandler<ListarInventariosQuery, IReadOnlyList<InventarioResumoDto>>
{
    private readonly IInventarioRepository _inventarios;

    public ListarInventariosQueryHandler(IInventarioRepository inventarios)
    {
        _inventarios = inventarios;
    }

    public async Task<IReadOnlyList<InventarioResumoDto>> Handle(
        ListarInventariosQuery request, CancellationToken cancellationToken)
    {
        var lista = await _inventarios.ListarAsync(cancellationToken);

        return lista.Select(inv => new InventarioResumoDto(
            inv.Id,
            inv.DataRealizacao,
            inv.Descricao,
            inv.Status.ToString(),
            inv.Itens.Count,
            inv.CriadoEm)).ToList().AsReadOnly();
    }
}
