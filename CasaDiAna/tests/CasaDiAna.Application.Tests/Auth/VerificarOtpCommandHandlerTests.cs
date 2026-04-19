using CasaDiAna.Application.Auth.Commands.VerificarOtp;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class VerificarOtpCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<IJwtService> _jwtService = new();
    private readonly VerificarOtpCommandHandler _handler;

    public VerificarOtpCommandHandlerTests()
    {
        _handler = new VerificarOtpCommandHandler(_repositorio.Object, _jwtService.Object);
    }

    private static Usuario CriarUsuarioCom2Fa()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com",
            BCrypt.Net.BCrypt.HashPassword("x"), PapelUsuario.Admin);
        usuario.HabilitarDoisFatores("+5511999998888");
        return usuario;
    }

    [Fact]
    public async Task DeveRetornarToken_QuandoCodigoValido()
    {
        var usuario = CriarUsuarioCom2Fa();
        var codigo = usuario.GerarOtp();
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _jwtService.Setup(j => j.GerarToken(usuario)).Returns("jwt-real");

        var resultado = await _handler.Handle(
            new VerificarOtpCommand(usuario.Id, codigo), CancellationToken.None);

        resultado.Token.Should().Be("jwt-real");
        resultado.Nome.Should().Be("Ana");
        usuario.CodigoOtpHash.Should().BeNull();
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCodigoInvalido()
    {
        var usuario = CriarUsuarioCom2Fa();
        usuario.GerarOtp();
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(usuario.Id, "000000"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Código inválido.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoOtpNuncaGerado()
    {
        var usuarioSemOtp = CriarUsuarioCom2Fa(); // CodigoOtpExpiraEm = null
        _repositorio.Setup(r => r.ObterPorIdAsync(usuarioSemOtp.Id, default)).ReturnsAsync(usuarioSemOtp);

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(usuarioSemOtp.Id, "123456"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Sessão inválida.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCodigoExpirado()
    {
        var usuario = CriarUsuarioCom2Fa();
        usuario.GerarOtp();
        // Simula expiração forçando CodigoOtpExpiraEm para o passado via reflexão
        typeof(Domain.Entities.Usuario)
            .GetProperty("CodigoOtpExpiraEm")!
            .SetValue(usuario, DateTime.UtcNow.AddMinutes(-1));
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(usuario.Id, "123456"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Código expirado. Faça login novamente.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Domain.Entities.Usuario?)null);

        var acao = () => _handler.Handle(
            new VerificarOtpCommand(Guid.NewGuid(), "123456"), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Sessão inválida.");
    }
}
