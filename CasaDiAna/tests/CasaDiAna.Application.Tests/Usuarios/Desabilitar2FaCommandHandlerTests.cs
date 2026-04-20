using CasaDiAna.Application.Usuarios.Commands.Desabilitar2Fa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Usuarios;

public class Desabilitar2FaCommandHandlerTests
{
    private readonly Mock<IUsuarioRepository> _repositorio = new();
    private readonly Mock<ICodigoRecuperacaoRepository> _codigos = new();
    private readonly Desabilitar2FaCommandHandler _handler;

    public Desabilitar2FaCommandHandlerTests()
    {
        _handler = new Desabilitar2FaCommandHandler(_repositorio.Object, _codigos.Object);
    }

    [Fact]
    public async Task DeveDesabilitar2Fa_QuandoUsuarioExiste()
    {
        var usuario = Usuario.Criar("Ana", "ana@casa.com", "hash", PapelUsuario.Admin);
        usuario.HabilitarTotp("JBSWY3DPEHPK3PXP");
        _repositorio.Setup(r => r.ObterPorIdAsync(usuario.Id, default)).ReturnsAsync(usuario);

        await _handler.Handle(new Desabilitar2FaCommand(usuario.Id), CancellationToken.None);

        usuario.TwoFactorHabilitado.Should().BeFalse();
        usuario.TotpSecret.Should().BeNull();
        _codigos.Verify(c => c.DeletarPorUsuarioAsync(usuario.Id, CancellationToken.None), Times.Once);
        _repositorio.Verify(r => r.Atualizar(usuario), Times.Once);
        _repositorio.Verify(r => r.SalvarAsync(CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUsuarioNaoEncontrado()
    {
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((Usuario?)null);

        var acao = () => _handler.Handle(
            new Desabilitar2FaCommand(Guid.NewGuid()), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Usuário não encontrado.");
    }
}
