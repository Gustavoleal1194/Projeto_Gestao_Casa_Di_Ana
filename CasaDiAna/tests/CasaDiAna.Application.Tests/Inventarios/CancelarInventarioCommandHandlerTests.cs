using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Commands.CancelarInventario;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Inventarios;

public class CancelarInventarioCommandHandlerTests
{
    private readonly Mock<IInventarioRepository> _inventarios = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CancelarInventarioCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public CancelarInventarioCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _handler = new CancelarInventarioCommandHandler(_inventarios.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveCancelarInventario_QuandoUsuarioEhDono()
    {
        var inventario = Inventario.Criar(DateTime.UtcNow, _usuarioId);
        var cancelado = Inventario.Criar(DateTime.UtcNow, _usuarioId);
        cancelado.Cancelar(_usuarioId);

        _inventarios.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(inventario)
            .ReturnsAsync(cancelado);
        _inventarios.Setup(r => r.Atualizar(It.IsAny<Inventario>()));
        _inventarios.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new CancelarInventarioCommand(inventario.Id), CancellationToken.None);

        resultado.Status.Should().Be("Cancelado");
    }

    [Fact]
    public async Task DeveCancelarInventario_QuandoUsuarioEhAdmin()
    {
        var dono = Guid.NewGuid();
        var inventario = Inventario.Criar(DateTime.UtcNow, dono);
        var cancelado = Inventario.Criar(DateTime.UtcNow, dono);
        cancelado.Cancelar(_usuarioId);

        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Admin");
        _inventarios.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(inventario)
            .ReturnsAsync(cancelado);
        _inventarios.Setup(r => r.Atualizar(It.IsAny<Inventario>()));
        _inventarios.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new CancelarInventarioCommand(inventario.Id), CancellationToken.None);

        resultado.Status.Should().Be("Cancelado");
    }

    [Fact]
    public async Task DeveLancarUnauthorized_QuandoOutroUsuarioTentaCancelar()
    {
        var dono = Guid.NewGuid();
        var inventario = Inventario.Criar(DateTime.UtcNow, dono);
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(inventario.Id, default)).ReturnsAsync(inventario);

        var acao = () => _handler.Handle(
            new CancelarInventarioCommand(inventario.Id), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Acesso negado*");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoInventarioNaoEncontrado()
    {
        var id = Guid.NewGuid();
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(id, default)).ReturnsAsync((Inventario?)null);

        var acao = () => _handler.Handle(new CancelarInventarioCommand(id), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Inventário*");
    }
}
