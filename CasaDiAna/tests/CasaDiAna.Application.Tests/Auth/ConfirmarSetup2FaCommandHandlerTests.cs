// tests/CasaDiAna.Application.Tests/Auth/ConfirmarSetup2FaCommandHandlerTests.cs
using CasaDiAna.Application.Auth.Commands.ConfirmarSetup2Fa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Auth;

public class ConfirmarSetup2FaCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<ITotpService> _totp = new();
    private readonly Mock<ICodigoRecuperacaoRepository> _codigos = new();
    private readonly ConfirmarSetup2FaCommandHandler _handler;

    public ConfirmarSetup2FaCommandHandlerTests()
    {
        _handler = new ConfirmarSetup2FaCommandHandler(
            _repositorio.Object, _totp.Object, _codigos.Object);
    }

    [Fact]
    public async Task DevePersistirTotpECodigosRecuperacao_QuandoCodigoValido()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        var secret = "JBSWY3DPEHPK3PXP";
        var codigosPlain = new List<string>
        {
            "AAAA-1111", "BBBB-2222", "CCCC-3333", "DDDD-4444",
            "EEEE-5555", "FFFF-6666", "1111-AAAA", "2222-BBBB"
        };
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.ValidarCodigo(secret, "654321")).Returns(true);

        await _handler.Handle(
            new ConfirmarSetup2FaCommand(usuario.Id, secret, "654321", codigosPlain),
            CancellationToken.None);

        usuario.TwoFactorHabilitado.Should().BeTrue();
        usuario.TotpSecret.Should().Be(secret);
        _repositorio.Verify(r => r.Atualizar(usuario), Times.Once);
        _repositorio.Verify(r => r.SalvarAsync(CancellationToken.None), Times.Once);
        _codigos.Verify(c => c.AdicionarAsync(
            It.Is<IEnumerable<CodigoRecuperacao>>(list => list.Count() == 8),
            CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCodigoInvalido()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);
        _totp.Setup(t => t.ValidarCodigo(It.IsAny<string>(), "000000")).Returns(false);

        var acao = () => _handler.Handle(
            new ConfirmarSetup2FaCommand(usuario.Id, "SECRET", "000000",
                new List<string> { "AAAA-1111" }),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Código inválido. Verifique o app e tente novamente.");

        usuario.TwoFactorHabilitado.Should().BeFalse();
        _repositorio.Verify(r => r.Atualizar(It.IsAny<Usuario>()), Times.Never);
    }
}
