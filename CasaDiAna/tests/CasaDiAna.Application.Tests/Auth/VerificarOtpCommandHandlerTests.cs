using CasaDiAna.Application.Auth.Commands.VerificarOtp;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class VerificarOtpCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<IJwtService> _jwtService = new();
    private readonly Mock<ITotpService> _totp = new();
    private readonly VerificarOtpCommandHandler _handler;

    public VerificarOtpCommandHandlerTests()
    {
        _handler = new VerificarOtpCommandHandler(
            _repositorio.Object, _jwtService.Object, _totp.Object);
    }

    private static Usuario CriarUsuarioCom2Fa()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com",
            BCrypt.Net.BCrypt.HashPassword("x"), PapelUsuario.Admin);
        usuario.HabilitarTotp("JBSWY3DPEHPK3PXP");
        return usuario;
    }

    [Fact]
    public async Task DeveRetornarToken_QuandoCodigoTotpValido()
    {
        var usuario = CriarUsuarioCom2Fa();
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _totp.Setup(t => t.ValidarCodigo("JBSWY3DPEHPK3PXP", "123456")).Returns(true);
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("jwt-real");

        var resultado = await _handler.Handle(
            new VerificarOtpCommand(usuario.Id, "123456"), CancellationToken.None);

        resultado.Token.Should().Be("jwt-real");
        resultado.Nome.Should().Be("Ana");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCodigoInvalido()
    {
        var usuario = CriarUsuarioCom2Fa();
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.ValidarCodigo(It.IsAny<string>(), "000000")).Returns(false);

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(usuario.Id, "000000"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Código inválido. Verifique o app autenticador.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(Guid.NewGuid(), "123456"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Sessão inválida.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoTotpSecretNulo()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com",
            BCrypt.Net.BCrypt.HashPassword("x"), PapelUsuario.Admin);
        typeof(Usuario).GetProperty("TwoFactorHabilitado")!.SetValue(usuario, true);
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(usuario.Id, "123456"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("2FA não configurado.");
    }
}
