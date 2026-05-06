using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Commands.IniciarInventario;
using CasaDiAna.Application.Inventarios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Queries.ObterInventario;

public class ObterInventarioQueryHandler : IRequestHandler<ObterInventarioQuery, InventarioDto>
{
    private readonly IInventarioRepository _inventarios;
    private readonly ICurrentUserService _currentUser;

    public ObterInventarioQueryHandler(IInventarioRepository inventarios, ICurrentUserService currentUser)
    {
        _inventarios = inventarios;
        _currentUser = currentUser;
    }

    public async Task<InventarioDto> Handle(
        ObterInventarioQuery request, CancellationToken cancellationToken)
    {
        var inventario = await _inventarios.ObterPorIdComItensAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Inventário não encontrado.");

        if (inventario.CriadoPor != _currentUser.UsuarioId && _currentUser.Papel != "Admin")
            throw new UnauthorizedAccessException("Acesso negado.");

        return IniciarInventarioCommandHandler.ToDto(inventario);
    }
}
