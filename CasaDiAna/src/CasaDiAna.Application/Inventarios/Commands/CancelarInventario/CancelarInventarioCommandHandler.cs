using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Commands.IniciarInventario;
using CasaDiAna.Application.Inventarios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Commands.CancelarInventario;

public class CancelarInventarioCommandHandler : IRequestHandler<CancelarInventarioCommand, InventarioDto>
{
    private readonly IInventarioRepository _inventarios;
    private readonly ICurrentUserService _currentUser;

    public CancelarInventarioCommandHandler(
        IInventarioRepository inventarios,
        ICurrentUserService currentUser)
    {
        _inventarios = inventarios;
        _currentUser = currentUser;
    }

    public async Task<InventarioDto> Handle(
        CancelarInventarioCommand request, CancellationToken cancellationToken)
    {
        var inventario = await _inventarios.ObterPorIdComItensAsync(request.InventarioId, cancellationToken)
            ?? throw new DomainException("Inventário não encontrado.");

        if (inventario.CriadoPor != _currentUser.UsuarioId && _currentUser.Papel != "Admin")
            throw new UnauthorizedAccessException("Acesso negado.");

        inventario.Cancelar(_currentUser.UsuarioId);
        _inventarios.Atualizar(inventario);
        await _inventarios.SalvarAsync(cancellationToken);

        var cancelado = await _inventarios.ObterPorIdComItensAsync(inventario.Id, cancellationToken);
        return IniciarInventarioCommandHandler.ToDto(cancelado!);
    }
}
