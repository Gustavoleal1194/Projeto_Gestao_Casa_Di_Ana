using CasaDiAna.Domain.Exceptions;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.ReenviarCodigo;

// TODO (Task 6+): este handler será substituído pelo fluxo TOTP.
// O envio de SMS foi removido — o 2FA agora é via TOTP (autenticador).
public class ReenviarCodigoCommandHandler : IRequestHandler<ReenviarCodigoCommand, Unit>
{
    public Task<Unit> Handle(ReenviarCodigoCommand request, CancellationToken cancellationToken)
    {
        throw new DomainException("O envio de código por SMS foi descontinuado. Use o aplicativo autenticador TOTP.");
    }
}
