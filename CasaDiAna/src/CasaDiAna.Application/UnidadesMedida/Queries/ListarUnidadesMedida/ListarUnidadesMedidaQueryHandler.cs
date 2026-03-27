using CasaDiAna.Application.UnidadesMedida.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.UnidadesMedida.Queries.ListarUnidadesMedida;

public class ListarUnidadesMedidaQueryHandler
    : IRequestHandler<ListarUnidadesMedidaQuery, IReadOnlyList<UnidadeMedidaDto>>
{
    private readonly IUnidadeMedidaRepository _unidades;

    public ListarUnidadesMedidaQueryHandler(IUnidadeMedidaRepository unidades) =>
        _unidades = unidades;

    public async Task<IReadOnlyList<UnidadeMedidaDto>> Handle(
        ListarUnidadesMedidaQuery request, CancellationToken cancellationToken)
    {
        var lista = await _unidades.ListarAsync(cancellationToken);
        return lista
            .Select(u => new UnidadeMedidaDto(u.Id, u.Codigo, u.Descricao))
            .ToList()
            .AsReadOnly();
    }
}
