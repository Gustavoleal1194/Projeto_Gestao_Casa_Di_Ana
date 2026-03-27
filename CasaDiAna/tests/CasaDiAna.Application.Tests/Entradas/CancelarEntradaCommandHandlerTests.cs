using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.CancelarEntrada;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Entradas;

public class CancelarEntradaCommandHandlerTests
{
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly Mock<IIngredienteRepository> _ingredientes = new();
    private readonly Mock<IMovimentacaoRepository> _movimentacoes = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CancelarEntradaCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public CancelarEntradaCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new CancelarEntradaCommandHandler(
            _entradas.Object,
            _ingredientes.Object,
            _movimentacoes.Object,
            _currentUser.Object);
    }

    [Fact]
    public async Task DeveCancelarEntrada_ERevertEstoque()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entrada.AdicionarItem(ingredienteId, 10, 5m);

        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        ingrediente.AtualizarEstoque(10, _usuarioId);

        var entradaCancelada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaCancelada.AdicionarItem(ingredienteId, 10, 5m);
        entradaCancelada.Cancelar(_usuarioId);

        _entradas.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entrada)
            .ReturnsAsync(entradaCancelada);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.Atualizar(It.IsAny<EntradaMercadoria>()));
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new CancelarEntradaCommand(entrada.Id),
            CancellationToken.None);

        resultado.Status.Should().Be("Cancelada");
        _ingredientes.Verify(r => r.Atualizar(It.IsAny<Ingrediente>()), Times.Once);
        _movimentacoes.Verify(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoEntradaNaoEncontrada()
    {
        var entradaId = Guid.NewGuid();
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entradaId, default))
            .ReturnsAsync((EntradaMercadoria?)null);

        var acao = () => _handler.Handle(
            new CancelarEntradaCommand(entradaId),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Entrada*");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoEntradaJaCancelada()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entrada.AdicionarItem(ingredienteId, 5, 3m);
        entrada.Cancelar(_usuarioId);

        _entradas.Setup(r => r.ObterPorIdComItensAsync(entrada.Id, default)).ReturnsAsync(entrada);

        var acao = () => _handler.Handle(
            new CancelarEntradaCommand(entrada.Id),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*cancelada*");
    }
}
