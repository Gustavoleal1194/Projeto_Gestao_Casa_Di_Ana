using CasaDiAna.Application.Usuarios.Commands.Habilitar2Fa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Usuarios;

public class Habilitar2FaCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Habilitar2FaCommandHandler _handler;

    public Habilitar2FaCommandHandlerTests()
    {
        _handler = new Habilitar2FaCommandHandler(_repositorio.Object);
    }

    [Fact]
    public async Task DeveHabilitar2Fa_QuandoUsuarioExiste()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);

        await _handler.Handle(
            new Habilitar2FaCommand(usuario.Id, "+5511999998888"), CancellationToken.None);

        usuario.TwoFactorHabilitado.Should().BeTrue();
        usuario.Telefone.Should().Be("+5511999998888");
        _repositorio.Verify(r => r.Atualizar(usuario), Times.Once);
        _repositorio.Verify(r => r.SalvarAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new Habilitar2FaCommand(Guid.NewGuid(), "+5511999998888"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Usuário não encontrado.");
    }
}
