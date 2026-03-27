using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Commands.FinalizarInventario;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Inventarios;

public class FinalizarInventarioCommandHandlerTests
{
    private readonly Mock<IInventarioRepository> _inventarios = new();
    private readonly Mock<IIngredienteRepository> _ingredientes = new();
    private readonly Mock<IMovimentacaoRepository> _movimentacoes = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly FinalizarInventarioCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public FinalizarInventarioCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new FinalizarInventarioCommandHandler(
            _inventarios.Object,
            _ingredientes.Object,
            _movimentacoes.Object,
            _currentUser.Object);
    }

    [Fact]
    public async Task DeveFinalizarInventario_SemDiferencas()
    {
        var inventario = Inventario.Criar(DateTime.UtcNow, _usuarioId, "Teste");
        var ingredienteId = Guid.NewGuid();
        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        ingrediente.AtualizarEstoque(10, _usuarioId);
        // Quantidade sistema = 10, contada = 10 → diferença = 0
        inventario.AdicionarItem(ingredienteId, 10, 10);

        var inventarioFinalizado = Inventario.Criar(DateTime.UtcNow, _usuarioId);
        inventarioFinalizado.AdicionarItem(ingredienteId, 10, 10);
        inventarioFinalizado.Finalizar(_usuarioId);

        _inventarios.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(inventario)
            .ReturnsAsync(inventarioFinalizado);
        _inventarios.Setup(r => r.Atualizar(It.IsAny<Inventario>()));
        _inventarios.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new FinalizarInventarioCommand(inventario.Id),
            CancellationToken.None);

        resultado.Status.Should().Be("Finalizado");
        // Sem diferenças → sem ajustes de estoque
        _movimentacoes.Verify(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default), Times.Never);
    }

    [Fact]
    public async Task DeveFinalizarInventario_ComAjustePositivo()
    {
        var inventario = Inventario.Criar(DateTime.UtcNow, _usuarioId);
        var ingredienteId = Guid.NewGuid();
        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        ingrediente.AtualizarEstoque(10, _usuarioId);
        // Sistema: 10, Contada: 15 → diferença +5
        inventario.AdicionarItem(ingredienteId, 10, 15);

        var inventarioFinalizado = Inventario.Criar(DateTime.UtcNow, _usuarioId);
        inventarioFinalizado.AdicionarItem(ingredienteId, 10, 15);
        inventarioFinalizado.Finalizar(_usuarioId);

        _inventarios.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(inventario)
            .ReturnsAsync(inventarioFinalizado);
        _inventarios.Setup(r => r.Atualizar(It.IsAny<Inventario>()));
        _inventarios.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);

        var resultado = await _handler.Handle(
            new FinalizarInventarioCommand(inventario.Id),
            CancellationToken.None);

        resultado.Status.Should().Be("Finalizado");
        _movimentacoes.Verify(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default), Times.Once);
        _ingredientes.Verify(r => r.Atualizar(It.IsAny<Ingrediente>()), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoInventarioNaoEncontrado()
    {
        var id = Guid.NewGuid();
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(id, default))
            .ReturnsAsync((Inventario?)null);

        var acao = () => _handler.Handle(
            new FinalizarInventarioCommand(id),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Inventário*");
    }
}
