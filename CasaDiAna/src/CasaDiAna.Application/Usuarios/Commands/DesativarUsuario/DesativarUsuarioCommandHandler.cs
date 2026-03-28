using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.DesativarUsuario;

public class DesativarUsuarioCommandHandler : IRequestHandler<DesativarUsuarioCommand>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly ICurrentUserService _currentUser;

    public DesativarUsuarioCommandHandler(
        IUsuarioRepository usuarios,
        ICurrentUserService currentUser)
    {
        _usuarios = usuarios;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarUsuarioCommand request, CancellationToken ct)
    {
        if (request.Id == _currentUser.UsuarioId)
            throw new DomainException("Você não pode desativar sua própria conta.");

        var usuario = await _usuarios.ObterPorIdAsync(request.Id, ct)
            ?? throw new DomainException("Usuário não encontrado.");

        usuario.Desativar();
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(ct);
    }
}
