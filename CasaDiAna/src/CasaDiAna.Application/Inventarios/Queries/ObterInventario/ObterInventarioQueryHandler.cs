using CasaDiAna.Application.Inventarios.Commands.IniciarInventario;
using CasaDiAna.Application.Inventarios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Queries.ObterInventario;

public class ObterInventarioQueryHandler : IRequestHandler<ObterInventarioQuery, InventarioDto>
{
    private readonly IInventarioRepository _inventarios;

    public ObterInventarioQueryHandler(IInventarioRepository inventarios)
    {
        _inventarios = inventarios;
    }

    public async Task<InventarioDto> Handle(
        ObterInventarioQuery request, CancellationToken cancellationToken)
    {
        var inventario = await _inventarios.ObterPorIdComItensAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Inventário não encontrado.");

        return IniciarInventarioCommandHandler.ToDto(inventario);
    }
}
