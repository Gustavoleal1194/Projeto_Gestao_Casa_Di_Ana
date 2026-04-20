using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.Habilitar2Fa;

// TODO (Task 6+): substituir pela geração real de TOTP secret + QR code.
public class Habilitar2FaCommandHandler : IRequestHandler<Habilitar2FaCommand, Unit>
{
    private readonly IUsuarioRepository _usuarios;

    public Habilitar2FaCommandHandler(IUsuarioRepository usuarios) => _usuarios = usuarios;

    public async Task<Unit> Handle(Habilitar2FaCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        // Temporário: usa o campo Telefone como placeholder de secret até Task 6 implementar TOTP real.
        usuario.HabilitarTotp(request.Telefone);
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(cancellationToken);

        return Unit.Value;
    }
}
