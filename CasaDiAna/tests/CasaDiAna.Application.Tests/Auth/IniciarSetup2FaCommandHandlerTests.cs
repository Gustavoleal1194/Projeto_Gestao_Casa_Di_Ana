// tests/CasaDiAna.Application.Tests/Auth/IniciarSetup2FaCommandHandlerTests.cs
using CasaDiAna.Application.Auth.Commands.IniciarSetup2Fa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class IniciarSetup2FaCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<ITotpService> _totp = new();
    private readonly IniciarSetup2FaCommandHandler _handler;

    public IniciarSetup2FaCommandHandlerTests()
    {
        _handler = new IniciarSetup2FaCommandHandler(_repositorio.Object, _totp.Object);
    }

    [Fact]
    public async Task DeveRetornarQrCodeUrlECodigosRecuperacao_SemPersistir()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.GerarSecret()).Returns("JBSWY3DPEHPK3PXP");
        _totp.Setup(t => t.GerarQrCodeUrl("JBSWY3DPEHPK3PXP", "ana@casa.com", "Casa di Ana"))
             .Returns("otpauth://totp/Casa%20di%20Ana:ana%40casa.com?secret=JBSWY3DPEHPK3PXP&issuer=Casa%20di%20Ana&algorithm=SHA1&digits=6&period=30");

        var resultado = await _handler.Handle(
            new IniciarSetup2FaCommand(usuario.Id), CancellationToken.None);

        resultado.QrCodeUrl.Should().StartWith("otpauth://totp/");
        resultado.SecretManual.Should().Be("JBSWY3DPEHPK3PXP");
        resultado.CodigosRecuperacao.Should().HaveCount(8);
        resultado.CodigosRecuperacao.Should().AllSatisfy(c =>
            c.Should().MatchRegex(@"^[0-9A-F]{4}-[0-9A-F]{4}$"));

        // Não deve persistir nada
        _repositorio.Verify(r => r.Atualizar(It.IsAny<Usuario>()), Times.Never);
        _repositorio.Verify(r => r.SalvarAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new IniciarSetup2FaCommand(Guid.NewGuid()), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Usuário não encontrado.");
    }
}
