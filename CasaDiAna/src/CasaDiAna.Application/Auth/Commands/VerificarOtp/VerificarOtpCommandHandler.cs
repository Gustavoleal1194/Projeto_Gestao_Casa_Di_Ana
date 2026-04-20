using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.VerificarOtp;

// TODO (Task 6+): substituir pela verificação TOTP real.
public class VerificarOtpCommandHandler : IRequestHandler<VerificarOtpCommand, TokenDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IJwtService _jwtService;

    public VerificarOtpCommandHandler(IUsuarioRepository usuarios, IJwtService jwtService)
    {
        _usuarios = usuarios;
        _jwtService = jwtService;
    }

    public async Task<TokenDto> Handle(VerificarOtpCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Sessão inválida.");

        if (!usuario.TwoFactorHabilitado || usuario.TotpSecret is null)
            throw new UnauthorizedAccessException("Sessão inválida.");

        // Verificação TOTP real será implementada na Task 6.
        // Por enquanto lança erro indicando que o fluxo precisa ser atualizado.
        throw new DomainException("Verificação TOTP ainda não implementada. Aguardando Task 6.");
    }
}
