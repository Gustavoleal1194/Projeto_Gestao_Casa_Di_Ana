using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.RedefinirSenha;

public class RedefinirSenhaCommandHandler : IRequestHandler<RedefinirSenhaCommand>
{
    private readonly IUsuarioRepository _usuarios;

    public RedefinirSenhaCommandHandler(IUsuarioRepository usuarios) => _usuarios = usuarios;

    public async Task Handle(RedefinirSenhaCommand request, CancellationToken ct)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.Id, ct)
            ?? throw new DomainException("Usuário não encontrado.");

        usuario.RedefinirSenha(Usuario.HashSenha(request.NovaSenha));
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(ct);
    }
}
