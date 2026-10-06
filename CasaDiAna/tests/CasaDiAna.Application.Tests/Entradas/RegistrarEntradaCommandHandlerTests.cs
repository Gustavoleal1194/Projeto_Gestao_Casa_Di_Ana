using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Entradas;

public class RegistrarEntradaCommandHandlerTests
{
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly Mock<IIngredienteRepository> _ingredientes = new();
    private readonly Mock<IUtensilioRepository> _utensilios = new();
    private readonly Mock<IMovimentacaoRepository> _movimentacoes = new();
    private readonly Mock<IMovimentacaoUtensilioRepository> _movimentacoesUtensilio = new();
    private readonly Mock<IFornecedorRepository> _fornecedores = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<INotificacaoEstoqueService> _notificacoes = new();
    private readonly RegistrarEntradaCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public RegistrarEntradaCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new RegistrarEntradaCommandHandler(
            _entradas.Object,
            _ingredientes.Object,
            _utensilios.Object,
            _movimentacoes.Object,
            _movimentacoesUtensilio.Object,
            _fornecedores.Object,
            _currentUser.Object,
            _notificacoes.Object);
    }

    private static Ingrediente CriarIngrediente()
        => Ingrediente.Criar("Farinha", unidadeMedidaId: 1, estoqueMinimo: 0, criadoPor: Guid.NewGuid());

    private static Utensilio CriarUtensilio()
        => Utensilio.Criar("Detergente", unidadeMedidaId: 1, estoqueMinimo: 0, criadoPor: Guid.NewGuid());

    [Fact]
    public async Task DeveRegistrarEntrada_QuandoDadosValidos()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var ingrediente = CriarIngrediente();

        var entradaRetornada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaRetornada.AdicionarItem(ingredienteId, 10, 5.50m);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _ingredientes.Setup(r => r.Atualizar(It.IsAny<Ingrediente>()));
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.AdicionarAsync(It.IsAny<EntradaMercadoria>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entradaRetornada);

        var resultado = await _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto> { new(ingredienteId, 10, 5.50m) },
                "Operador Teste"),
            CancellationToken.None);

        resultado.Should().NotBeNull();
        resultado.Itens.Should().HaveCount(1);
        _ingredientes.Verify(r => r.Atualizar(It.IsAny<Ingrediente>()), Times.Once);
        _movimentacoes.Verify(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveRegistrarEntrada_QuandoSoUtensilio()
    {
        var fornecedorId = Guid.NewGuid();
        var utensilioId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var utensilio = CriarUtensilio();

        var entradaRetornada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaRetornada.AdicionarItemUtensilio(utensilioId, 3, 12.50m);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _utensilios.Setup(r => r.ObterPorIdAsync(utensilioId, default)).ReturnsAsync(utensilio);
        _utensilios.Setup(r => r.Atualizar(It.IsAny<Utensilio>()));
        _movimentacoesUtensilio.Setup(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.AdicionarAsync(It.IsAny<EntradaMercadoria>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entradaRetornada);

        var resultado = await _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto>(),
                "Operador Teste",
                ItensUtensilio: new List<ItemEntradaUtensilioInputDto> { new(utensilioId, 3, 12.50m) }),
            CancellationToken.None);

        resultado.Should().NotBeNull();
        resultado.ItensUtensilio.Should().HaveCount(1);
        _utensilios.Verify(r => r.Atualizar(It.IsAny<Utensilio>()), Times.Once);
        _movimentacoesUtensilio.Verify(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveRegistrarEntrada_QuandoMistaIngredienteEUtensilio()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var utensilioId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var ingrediente = CriarIngrediente();
        var utensilio = CriarUtensilio();

        var entradaRetornada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entradaRetornada.AdicionarItem(ingredienteId, 10, 5m);
        entradaRetornada.AdicionarItemUtensilio(utensilioId, 2, 8m);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);
        _utensilios.Setup(r => r.ObterPorIdAsync(utensilioId, default)).ReturnsAsync(utensilio);
        _movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), default)).Returns(Task.CompletedTask);
        _movimentacoesUtensilio.Setup(r => r.AdicionarAsync(It.IsAny<MovimentacaoUtensilio>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.AdicionarAsync(It.IsAny<EntradaMercadoria>(), default)).Returns(Task.CompletedTask);
        _entradas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(entradaRetornada);

        var resultado = await _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto> { new(ingredienteId, 10, 5m) },
                "Operador Teste",
                ItensUtensilio: new List<ItemEntradaUtensilioInputDto> { new(utensilioId, 2, 8m) }),
            CancellationToken.None);

        resultado.Itens.Should().HaveCount(1);
        resultado.ItensUtensilio.Should().HaveCount(1);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoFornecedorNaoEncontrado()
    {
        var fornecedorId = Guid.NewGuid();
        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync((Fornecedor?)null);

        var acao = () => _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto> { new(Guid.NewGuid(), 1, 1) },
                "Operador Teste"),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Fornecedor*");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoIngredienteInativo()
    {
        var fornecedorId = Guid.NewGuid();
        var ingredienteId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var ingrediente = CriarIngrediente();
        ingrediente.Desativar(_usuarioId);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _ingredientes.Setup(r => r.ObterPorIdAsync(ingredienteId, default)).ReturnsAsync(ingrediente);

        var acao = () => _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto> { new(ingredienteId, 5, 2) },
                "Operador Teste"),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*inativo*");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUtensilioInativo()
    {
        var fornecedorId = Guid.NewGuid();
        var utensilioId = Guid.NewGuid();
        var fornecedor = Fornecedor.Criar("Distribuidora XYZ", _usuarioId);
        var utensilio = CriarUtensilio();
        utensilio.Desativar(_usuarioId);

        _fornecedores.Setup(r => r.ObterPorIdAsync(fornecedorId, default)).ReturnsAsync(fornecedor);
        _utensilios.Setup(r => r.ObterPorIdAsync(utensilioId, default)).ReturnsAsync(utensilio);

        var acao = () => _handler.Handle(
            new RegistrarEntradaCommand(
                fornecedorId,
                DateTime.UtcNow,
                new List<ItemEntradaInputDto>(),
                "Operador Teste",
                ItensUtensilio: new List<ItemEntradaUtensilioInputDto> { new(utensilioId, 1, 2) }),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*inativo*");
    }
}
