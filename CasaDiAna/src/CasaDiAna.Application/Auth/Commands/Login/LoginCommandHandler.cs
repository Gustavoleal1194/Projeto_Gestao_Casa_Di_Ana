// src/CasaDiAna.Application/Auth/Commands/Login/LoginCommandHandler.cs
using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResultDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IUsuarioRepository usuarios, IJwtService jwtService)
    {
        _usuarios = usuarios;
        _jwtService = jwtService;
    }

    public async Task<LoginResultDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorEmailAsync(request.Email, cancellationToken)
            ?? throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        if (!usuario.SenhaCorreta(request.Senha))
            throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        if (usuario.TwoFactorHabilitado)
        {
            var tokenTemp = _jwtService.GerarTokenTemporario(usuario.Id);
            return new LoginResultDto(
                Requer2Fa: true,
                TokenTemporario: tokenTemp,
                Token: null,
                Nome: null,
                Papel: null);
        }

        usuario.RegistrarLogin(request.Ip, request.UserAgent);
        _usuarios.Atualizar(usuario);
        await _usuarios.SalvarAsync(cancellationToken);

        var token = _jwtService.GerarToken(usuario);
        return new LoginResultDto(
            Requer2Fa: false,
            Token: token,
            Nome: usuario.Nome,
            Papel: usuario.Papel.ToString(),
            TokenTemporario: null);
    }
}
