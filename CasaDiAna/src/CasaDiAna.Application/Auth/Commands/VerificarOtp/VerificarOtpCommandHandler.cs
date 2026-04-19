using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.VerificarOtp;

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

        if (!usuario.TwoFactorHabilitado)
            throw new UnauthorizedAccessException("Sessão inválida.");

        if (usuario.CodigoOtpExpiraEm is null)
            throw new UnauthorizedAccessException("Sessão inválida.");

        if (DateTime.UtcNow > usuario.CodigoOtpExpiraEm)
            throw new UnauthorizedAccessException("Código expirado. Faça login novamente.");

        if (usuario.CodigoOtpTentativas >= 3)
            throw new UnauthorizedAccessException("Número de tentativas excedido. Faça login novamente.");

        if (!usuario.ValidarOtp(request.Codigo))
        {
            _usuarios.Atualizar(usuario);
            await _usuarios.SalvarAsync(cancellationToken);
            var msg = usuario.CodigoOtpTentativas >= 3
                ? "Número de tentativas excedido. Faça login novamente."
                : "Código inválido.";
            throw new UnauthorizedAccessException(msg);
        }

        usuario.LimparOtp();
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(cancellationToken);

        var token = _jwtService.GerarToken(usuario);
        return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
    }
}
