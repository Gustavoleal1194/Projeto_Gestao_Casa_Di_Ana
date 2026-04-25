// src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommandHandler.cs
using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.VerificarOtp;

public class VerificarOtpCommandHandler : IRequestHandler<VerificarOtpCommand, TokenDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IJwtService _jwtService;
    private readonly ITotpService _totp;

    public VerificarOtpCommandHandler(
        IUsuarioRepository usuarios,
        IJwtService jwtService,
        ITotpService totp)
    {
        _usuarios = usuarios;
        _jwtService = jwtService;
        _totp = totp;
    }

    public async Task<TokenDto> Handle(VerificarOtpCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Sessão inválida.");

        if (!usuario.TwoFactorHabilitado)
            throw new UnauthorizedAccessException("Sessão inválida.");

        if (usuario.TotpSecret is null)
            throw new DomainException("2FA não configurado.");

        if (!_totp.ValidarCodigo(usuario.TotpSecret, request.Codigo))
            throw new DomainException("Código inválido. Verifique o app autenticador.");

        usuario.RegistrarLogin(request.Ip, request.UserAgent);
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(cancellationToken);
        var token = _jwtService.GerarToken(usuario);
        return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
    }
}
