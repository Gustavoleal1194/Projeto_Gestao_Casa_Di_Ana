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
    private readonly ICodigoRecuperacaoRepository _codigosRecuperacao;

    public VerificarOtpCommandHandler(
        IUsuarioRepository usuarios,
        IJwtService jwtService,
        ITotpService totp,
        ICodigoRecuperacaoRepository codigosRecuperacao)
    {
        _usuarios = usuarios;
        _jwtService = jwtService;
        _totp = totp;
        _codigosRecuperacao = codigosRecuperacao;
    }

    public async Task<TokenDto> Handle(VerificarOtpCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Sessão inválida.");

        if (!usuario.TwoFactorHabilitado)
            throw new UnauthorizedAccessException("Sessão inválida.");

        if (usuario.TotpSecret is null)
            throw new DomainException("2FA não configurado.");

        // Tenta validar como TOTP
        if (_totp.ValidarCodigo(usuario.TotpSecret, request.Codigo))
        {
            var token = _jwtService.GerarToken(usuario);
            return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
        }

        // Tenta validar como recovery code
        var ativos = await _codigosRecuperacao.ObterAtivosPorUsuarioAsync(
            usuario.Id, cancellationToken);

        foreach (var codigo in ativos)
        {
            if (codigo.VerificarCodigo(request.Codigo))
            {
                await _codigosRecuperacao.MarcarUsadoAsync(codigo.Id, cancellationToken);
                await _codigosRecuperacao.SalvarAsync(cancellationToken);
                var token = _jwtService.GerarToken(usuario);
                return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
            }
        }

        throw new DomainException("Código inválido. Verifique o app ou use um código de recuperação.");
    }
}
