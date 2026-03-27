using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, TokenDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IUsuarioRepository usuarios, IJwtService jwtService)
    {
        _usuarios = usuarios;
        _jwtService = jwtService;
    }

    public async Task<TokenDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorEmailAsync(request.Email, cancellationToken)
            ?? throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        if (!usuario.SenhaCorreta(request.Senha))
            throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        var token = _jwtService.GerarToken(usuario);
        return new TokenDto(token, usuario.Nome, usuario.Papel.ToString());
    }
}
