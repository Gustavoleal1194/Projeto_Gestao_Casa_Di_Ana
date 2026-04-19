using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.Desabilitar2Fa;

public class Desabilitar2FaCommandHandler : IRequestHandler<Desabilitar2FaCommand, Unit>
{
    private readonly IUsuarioRepository _usuarios;

    public Desabilitar2FaCommandHandler(IUsuarioRepository usuarios) => _usuarios = usuarios;

    public async Task<Unit> Handle(Desabilitar2FaCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        usuario.DesabilitarDoisFatores();
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(cancellationToken);

        return Unit.Value;
    }
}
