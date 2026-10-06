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
    private readonly Mock<IUtensilioRepository> _utensilios = new();
    private readonly Mock<IMovimentacaoRepository> _movimentacoes = new();
    private readonly Mock<IMovimentacaoUtensilioRepository> _movimentacoesUtensilio = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CancelarEntradaCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public CancelarEntradaCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _handler = new CancelarEntradaCommandHandler(
            _entradas.Object,
            _ingredientes.Object,
            _utensilios.Object,
            _movimentacoes.Object,
            _movimentacoesUtensilio.Object,
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
    public async Task DeveCancelarEntradaMista_ERevertEstoqueDosDois()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var utensilioId = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entrada.AdicionarItem(ingredienteId, 10, 5m);
        entrada.AdicionarItemUtensilio(utensilioId, 4, 3m);

        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        ingrediente.AtualizarEstoque(10, _usuarioId);
        var utensilio = Utensilio.Criar("Detergente", 1, 0, _usuarioId);
        utensilio.AtualizarEstoque(4, _usuarioId);

        var entradaCancelada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaCancelada.AdicionarItem(ingredienteId, 10, 5m);
        entradaCancelada.AdicionarItemUtensilio(utensilioId, 4, 3m);
        entradaCancelada.Cancelar(_usuarioId);

        _entradas.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entrada)
            .ReturnsAsync(entradaCancelada);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _utensilios.Setup(r => r.ObterPorIdAsync(utensilioId, default)).ReturnsAsync(utensilio);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _utensilios.Setup(r => r.Atualizar(It.IsAny<Utensilio>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _movimentacoesUtensilio.Setup(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.Atualizar(It.IsAny<EntradaMercadoria>()));
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new CancelarEntradaCommand(entrada.Id),
            CancellationToken.None);

        resultado.Status.Should().Be("Cancelada");
        ingrediente.EstoqueAtual.Should().Be(0m);
        utensilio.EstoqueAtual.Should().Be(0m);
        _utensilios.Verify(r => r.Atualizar(It.IsAny<Utensilio>()), Times.Once);
        _movimentacoesUtensilio.Verify(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default), Times.Once);
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
    public async Task DeveLancarUnauthorized_QuandoOutroUsuarioTentaCancelar()
    {
        var donoDaEntrada = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, donoDaEntrada);
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entrada.Id, default)).ReturnsAsync(entrada);

        var acao = () => _handler.Handle(new CancelarEntradaCommand(entrada.Id), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Acesso negado*");
    }

    [Fact]
    public async Task DeveCancelarEntrada_QuandoUsuarioEhAdmin()
    {
        var donoDaEntrada = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, donoDaEntrada);
        entrada.AdicionarItem(ingredienteId, 5, 3m);

        var ingrediente = Ingrediente.Criar("Farinha", 1, 0, donoDaEntrada);
        ingrediente.AtualizarEstoque(5, donoDaEntrada);

        var entradaCancelada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, donoDaEntrada);
        entradaCancelada.AdicionarItem(ingredienteId, 5, 3m);
        entradaCancelada.Cancelar(_usuarioId);

        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Admin");
        _entradas.SetupSequence(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entrada)
            .ReturnsAsync(entradaCancelada);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.Atualizar(It.IsAny<EntradaMercadoria>()));
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(new CancelarEntradaCommand(entrada.Id), CancellationToken.None);

        resultado.Status.Should().Be("Cancelada");
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
