// tests/CasaDiAna.Application.Tests/Auth/LoginCommandHandlerTests.cs
using CasaDiAna.Application.Auth.Commands.Login;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class LoginCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<IJwtService> _jwtService = new();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _handler = new LoginCommandHandler(_repositorio.Object, _jwtService.Object);
    }

    [Fact]
    public async Task DeveRetornarToken_QuandoCredenciaisValidas_Sem2Fa()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("token-jwt");

        var resultado = await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123"), CancellationToken.None);

        resultado.Requer2Fa.Should().BeFalse();
        resultado.Token.Should().Be("token-jwt");
        resultado.Nome.Should().Be("Ana");
        resultado.Papel.Should().Be("Admin");
        _repositorio.Verify(r => r.Atualizar(usuario), Times.Once);
        _repositorio.Verify(r => r.SalvarAsync(default), Times.Once);
        usuario.TotalLogins.Should().Be(1);
    }

    [Fact]
    public async Task DeveRetornarTokenTemporario_QuandoCredenciaisValidas_Com2Fa()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        usuario.HabilitarTotp("JBSWY3DPEHPK3PXP");
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);
        _jwtService.Setup(j => j.GerarTokenTemporario(usuario.Id)).Returns("token-temp");

        var resultado = await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123"), CancellationToken.None);

        resultado.Requer2Fa.Should().BeTrue();
        resultado.TokenTemporario.Should().Be("token-temp");
        resultado.Token.Should().BeNull();
        _repositorio.Verify(r => r.Atualizar(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorEmailAsync(It.IsAny<string>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new LoginCommand("x@x.com", "123"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("E-mail ou senha inválidos.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoSenhaInvalida()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("correta");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);

        var acao = () => _handler.Handle(
            new LoginCommand("ana@casa.com", "errada"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("E-mail ou senha inválidos.");
    }

    [Fact]
    public async Task DeveRegistrarIpEUserAgent_QuandoLoginSemDoisFatores()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("token-jwt");

        await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123", "192.168.1.1", "Mozilla/5.0"),
            CancellationToken.None);

        usuario.IpUltimoLogin.Should().Be("192.168.1.1");
        usuario.UserAgentUltimoLogin.Should().Be("Mozilla/5.0");
        usuario.UltimoLogin.Should().NotBeNull();
        usuario.TotalLogins.Should().Be(1);
    }
}
