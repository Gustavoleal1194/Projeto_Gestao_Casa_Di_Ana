using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Commands.AdicionarItemInventario;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Inventarios;

public class AdicionarItemInventarioCommandHandlerTests
{
    private readonly Mock<IInventarioRepository> _inventarios = new();
    private readonly Mock<IIngredienteRepository> _ingredientes = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly AdicionarItemInventarioCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public AdicionarItemInventarioCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _handler = new AdicionarItemInventarioCommandHandler(
            _inventarios.Object, _ingredientes.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveAdicionarItem_QuandoUsuarioEhDono()
    {
        var ingredienteId = Guid.NewGuid();
        var inventario = Inventario.Criar(DateTime.UtcNow, _usuarioId);
        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        ingrediente.AtualizarEstoque(10, _usuarioId);
        var atualizado = Inventario.Criar(DateTime.UtcNow, _usuarioId);
        atualizado.AdicionarItem(ingredienteId, 10, 10);

        _inventarios.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(inventario)
            .ReturnsAsync(atualizado);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _inventarios.Setup(r => r.AdicionarItemAsync(It.IsAny<ItemInventario>(), default)).Returns(Task.CompletedTask);
        _inventarios.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new AdicionarItemInventarioCommand(inventario.Id, ingredienteId, 10),
            CancellationToken.None);

        resultado.Should().NotBeNull();
        resultado.Itens.Should().HaveCount(1);
    }

    [Fact]
    public async Task DeveLancarUnauthorized_QuandoOutroUsuarioTentaAdicionarItem()
    {
        var dono = Guid.NewGuid();
        var inventario = Inventario.Criar(DateTime.UtcNow, dono);
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(inventario.Id, default)).ReturnsAsync(inventario);

        var acao = () => _handler.Handle(
            new AdicionarItemInventarioCommand(inventario.Id, Guid.NewGuid(), 5),
            CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Acesso negado*");
    }

    [Fact]
    public async Task DeveAdicionarItem_QuandoUsuarioEhAdmin()
    {
        var dono = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var inventario = Inventario.Criar(DateTime.UtcNow, dono);
        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, dono);
        ingrediente.AtualizarEstoque(10, dono);
        var atualizado = Inventario.Criar(DateTime.UtcNow, dono);
        atualizado.AdicionarItem(ingredienteId, 10, 10);

        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Admin");
        _inventarios.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(inventario)
            .ReturnsAsync(atualizado);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _inventarios.Setup(r => r.AdicionarItemAsync(It.IsAny<ItemInventario>(), default)).Returns(Task.CompletedTask);
        _inventarios.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new AdicionarItemInventarioCommand(inventario.Id, ingredienteId, 10),
            CancellationToken.None);

        resultado.Should().NotBeNull();
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoInventarioNaoEncontrado()
    {
        var id = Guid.NewGuid();
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(id, default)).ReturnsAsync((Inventario?)null);

        var acao = () => _handler.Handle(
            new AdicionarItemInventarioCommand(id, Guid.NewGuid(), 5),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Inventário*");
    }
}
