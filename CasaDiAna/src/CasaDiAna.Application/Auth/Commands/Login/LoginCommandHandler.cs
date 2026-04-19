using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResultDto>
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IJwtService _jwtService;
    private readonly ISmsService _smsService;

    public LoginCommandHandler(
        IUsuarioRepository usuarios,
        IJwtService jwtService,
        ISmsService smsService)
    {
        _usuarios = usuarios;
        _jwtService = jwtService;
        _smsService = smsService;
    }

    public async Task<LoginResultDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorEmailAsync(request.Email, cancellationToken)
            ?? throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        if (!usuario.SenhaCorreta(request.Senha))
            throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        if (usuario.TwoFactorHabilitado)
        {
            var codigo = usuario.GerarOtp();
            _usuarios.Atualizar(usuario);
            await _usuarios.SalvarAsync(cancellationToken);
            try
            {
                await _smsService.EnviarAsync(usuario.Telefone!, codigo, cancellationToken);
            }
            catch (Exception)
            {
                throw new DomainException("Não foi possível enviar o código por SMS. Verifique o número cadastrado ou contate o administrador.");
            }
            var tokenTemp = _jwtService.GerarTokenTemporario(usuario.Id);
            return new LoginResultDto(
                Requer2Fa: true,
                TokenTemporario: tokenTemp,
                Token: null,
                Nome: null,
                Papel: null,
                TelefoneMascarado: Usuario.MascararTelefone(usuario.Telefone!));
        }

        var token = _jwtService.GerarToken(usuario);
        return new LoginResultDto(
            Requer2Fa: false,
            Token: token,
            Nome: usuario.Nome,
            Papel: usuario.Papel.ToString(),
            TokenTemporario: null,
            TelefoneMascarado: null);
    }
}
