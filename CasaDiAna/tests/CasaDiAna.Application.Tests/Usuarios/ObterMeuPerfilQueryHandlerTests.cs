using CasaDiAna.Application.Usuarios.Queries.ObterMeuPerfil;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Usuarios;

public class ObterMeuPerfilQueryHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly ObterMeuPerfilQueryHandler _handler;

    public ObterMeuPerfilQueryHandlerTests()
    {
        _handler = new ObterMeuPerfilQueryHandler(_repositorio.Object);
    }

    [Fact]
    public async Task DeveRetornarPerfil_QuandoUsuarioExiste()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        usuario.RegistrarLogin("192.168.1.1", "Chrome/120");
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default))
                    .ReturnsAsync(usuario);

        var resultado = await _handler.Handle(
            new ObterMeuPerfilQuery(usuario.Id), CancellationToken.None);

        resultado.Nome.Should().Be("Ana");
        resultado.Email.Should().Be("ana@casa.com");
        resultado.Papel.Should().Be("Admin");
        resultado.TwoFactorHabilitado.Should().BeFalse();
        resultado.IpUltimoLogin.Should().Be("192.168.1.1");
        resultado.UserAgentUltimoLogin.Should().Be("Chrome/120");
        resultado.TotalLogins.Should().Be(1);
        resultado.UltimoLogin.Should().NotBeNull();
    }

    [Fact]
    public async Task DeveRetornarTwoFactorHabilitadoTrue_QuandoTotpAtivo()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        usuario.HabilitarTotp("JBSWY3DPEHPK3PXP");
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default))
                    .ReturnsAsync(usuario);

        var resultado = await _handler.Handle(
            new ObterMeuPerfilQuery(usuario.Id), CancellationToken.None);

        resultado.TwoFactorHabilitado.Should().BeTrue();
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Domain.Entities.Usuario?)null);

        var acao = () => _handler.Handle(
            new ObterMeuPerfilQuery(Guid.NewGuid()), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Usuário não encontrado.");
    }
}
