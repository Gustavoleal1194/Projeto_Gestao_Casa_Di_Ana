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
    private readonly Mock<ISmsService> _smsService = new();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _handler = new LoginCommandHandler(
            _repositorio.Object, _jwtService.Object, _smsService.Object);
    }

    [Fact]
    public async Task DeveRetornarToken_QuandoCredenciaisValidas_Sem2Fa()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("token-jwt");

        var resultado = await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123"), CancellationToken.None);

        resultado.Requer2Fa.Should().BeFalse();
        resultado.Token.Should().Be("token-jwt");
        resultado.Nome.Should().Be("Ana");
        resultado.Papel.Should().Be("Admin");
    }

    [Fact]
    public async Task DeveRetornarTokenTemporario_QuandoCredenciaisValidas_Com2Fa()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = Usuario.Criar("Ana", "ana@casa.com", senhaHash, PapelUsuario.Admin);
        usuario.HabilitarDoisFatores("+5511999998888");
        _repositorio.Setup(r => r.ObterPorEmailAsync("ana@casa.com", default))
                    .ReturnsAsync(usuario);
        _jwtService.Setup(j => j.GerarTokenTemporario(usuario.Id)).Returns("token-temp");
        _smsService.Setup(s => s.EnviarAsync(It.IsAny<string>(), It.IsAny<string>(), default))
                   .Returns(Task.CompletedTask);

        var resultado = await _handler.Handle(
            new LoginCommand("ana@casa.com", "senha123"), CancellationToken.None);

        resultado.Requer2Fa.Should().BeTrue();
        resultado.TokenTemporario.Should().Be("token-temp");
        resultado.Token.Should().BeNull();
        resultado.TelefoneMascarado.Should().Be("(**) *****-8888");
        _smsService.Verify(s => s.EnviarAsync("+5511999998888", It.IsAny<string>(), default), Times.Once);
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
}
