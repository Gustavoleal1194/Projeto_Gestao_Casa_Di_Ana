using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.EditarEntrada;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Entradas;

public class EditarEntradaCommandHandlerTests
{
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly Mock<IFornecedorRepository> _fornecedores = new();
    private readonly Mock<IIngredienteRepository> _ingredientes = new();
    private readonly Mock<IUtensilioRepository> _utensilios = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly EditarEntradaCommandHandler _handler;

    private readonly Guid _usuarioId = Guid.NewGuid();
    private readonly Guid _fornecedorId = Guid.NewGuid();
    private readonly Guid _ingredienteId = Guid.NewGuid();
    private readonly Guid _utensilioId = Guid.NewGuid();
    private readonly Ingrediente _ingrediente;
    private readonly Utensilio _utensilio;

    public EditarEntradaCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _currentUser.Setup(u => u.Papel).Returns("Compras");

        _ingrediente = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        _ingrediente.AtualizarEstoque(10, _usuarioId);
        _ingrediente.AtualizarCusto(5m, _usuarioId);
        _utensilio = Utensilio.Criar("Detergente", 1, 0, _usuarioId);
        _utensilio.AtualizarEstoque(4, _usuarioId);
        _utensilio.AtualizarCusto(3m, _usuarioId);

        _ingredientes.Setup(r => r.ObterPorIdAsync(_ingredienteId, It.IsAny<CancellationToken>())).ReturnsAsync(_ingrediente);
        _utensilios.Setup(r => r.ObterPorIdAsync(_utensilioId, It.IsAny<CancellationToken>())).ReturnsAsync(_utensilio);
        _entradas.Setup(r => r.ObterIngredientesComEntradaPosteriorAsync(It.IsAny<EntradaMercadoria>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());
        _entradas.Setup(r => r.ObterUtensiliosComEntradaPosteriorAsync(It.IsAny<EntradaMercadoria>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());
        _entradas.Setup(r => r.SalvarAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _handler = new EditarEntradaCommandHandler(
            _entradas.Object, _fornecedores.Object, _ingredientes.Object, _utensilios.Object, _currentUser.Object);
    }

    private EntradaMercadoria EntradaSalva(Guid? criadoPor = null)
    {
        var entrada = EntradaMercadoria.Criar(_fornecedorId, DateTime.UtcNow.Date, criadoPor ?? _usuarioId, "NF-1", "Ana");
        entrada.AdicionarItem(_ingredienteId, 10m, 5m);
        entrada.AdicionarItemUtensilio(_utensilioId, 4m, 3m);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entrada.Id, It.IsAny<CancellationToken>())).ReturnsAsync(entrada);
        return entrada;
    }

    private EditarEntradaCommand Comando(EntradaMercadoria entrada) => new(
        EntradaId: entrada.Id,
        FornecedorId: entrada.FornecedorId,
        DataEntrada: entrada.DataEntrada,
        RecebidoPor: "Bia",
        NumeroNotaFiscal: "NF-2");

    [Fact]
    public async Task DeveEditarCabecalhoECustos_EPropagarCusto_QuandoEntradaMaisRecente()
    {
        var entrada = EntradaSalva();
        var comando = Comando(entrada) with
        {
            CustosItens = new[] { new CustoItemInputDto(entrada.Itens.Single().Id, 6m) },
            CustosItensUtensilio = new[] { new CustoItemInputDto(entrada.ItensUtensilio.Single().Id, 2m) },
        };

        var resultado = await _handler.Handle(comando, CancellationToken.None);

        resultado.RecebidoPor.Should().Be("Bia");
        resultado.NumeroNotaFiscal.Should().Be("NF-2");
        resultado.CustoTotal.Should().Be(10m * 6m + 4m * 2m);
        _ingrediente.CustoUnitario.Should().Be(6m);
        _utensilio.CustoUnitario.Should().Be(2m);
        _entradas.Verify(r => r.SalvarAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task NaoDevePropagarCusto_QuandoExisteEntradaPosterior()
    {
        var entrada = EntradaSalva();
        _entradas.Setup(r => r.ObterIngredientesComEntradaPosteriorAsync(entrada, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid> { _ingredienteId });
        var comando = Comando(entrada) with
        {
            CustosItens = new[] { new CustoItemInputDto(entrada.Itens.Single().Id, 9m) },
        };

        await _handler.Handle(comando, CancellationToken.None);

        _ingrediente.CustoUnitario.Should().Be(5m);
        _ingredientes.Verify(r => r.Atualizar(It.IsAny<Ingrediente>()), Times.Never);
    }

    [Fact]
    public async Task DeveSincronizarCustoDoCadastro_MesmoSemAlterarCusto_QuandoEntradaPassaASerMaisRecente()
    {
        var entrada = EntradaSalva();
        _ingrediente.AtualizarCusto(99m, _usuarioId);

        await _handler.Handle(Comando(entrada) with { DataEntrada = DateTime.UtcNow.Date.AddDays(1) }, CancellationToken.None);

        _ingrediente.CustoUnitario.Should().Be(5m);
    }

    [Fact]
    public async Task NaoDeveAlterarEstoque()
    {
        var entrada = EntradaSalva();
        var comando = Comando(entrada) with
        {
            CustosItens = new[] { new CustoItemInputDto(entrada.Itens.Single().Id, 6m) },
        };

        await _handler.Handle(comando, CancellationToken.None);

        _ingrediente.EstoqueAtual.Should().Be(10m);
        _utensilio.EstoqueAtual.Should().Be(4m);
    }

    [Fact]
    public async Task DeveRejeitar_UsuarioQueNaoEAutorNemAdmin()
    {
        var entrada = EntradaSalva(criadoPor: Guid.NewGuid());

        var acao = () => _handler.Handle(Comando(entrada), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>();
        _entradas.Verify(r => r.SalvarAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DevePermitir_AdminEditarEntradaDeOutroUsuario()
    {
        _currentUser.Setup(u => u.Papel).Returns("Admin");
        var entrada = EntradaSalva(criadoPor: Guid.NewGuid());

        var resultado = await _handler.Handle(Comando(entrada), CancellationToken.None);

        resultado.RecebidoPor.Should().Be("Bia");
    }

    [Fact]
    public async Task DeveLancar_QuandoEntradaNaoEncontrada()
    {
        var acao = () => _handler.Handle(
            new EditarEntradaCommand(Guid.NewGuid(), _fornecedorId, DateTime.UtcNow, "Ana"),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("Entrada não encontrada.");
    }

    [Fact]
    public async Task DeveRejeitar_TrocaParaFornecedorInativo()
    {
        var entrada = EntradaSalva();
        var inativo = Fornecedor.Criar("Fornecedor Inativo", _usuarioId);
        inativo.Desativar(_usuarioId);
        _fornecedores.Setup(r => r.ObterPorIdAsync(inativo.Id, It.IsAny<CancellationToken>())).ReturnsAsync(inativo);

        var acao = () => _handler.Handle(Comando(entrada) with { FornecedorId = inativo.Id }, CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("Fornecedor está inativo.");
    }

    [Fact]
    public async Task NaoDeveValidarFornecedor_QuandoNaoMuda()
    {
        var entrada = EntradaSalva();

        await _handler.Handle(Comando(entrada), CancellationToken.None);

        _fornecedores.Verify(r => r.ObterPorIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeveManterBoletoVencido_EInserirApenasOsNovosPeloRepositorio()
    {
        var entrada = EntradaSalva();
        var vencido = DateTime.UtcNow.Date.AddDays(-3);
        entrada.AdicionarBoleto(vencido);
        var novo = DateTime.UtcNow.Date.AddDays(15);

        await _handler.Handle(
            Comando(entrada) with { DatasVencimentoBoleto = new[] { vencido, novo } },
            CancellationToken.None);

        _entradas.Verify(r => r.AdicionarBoletosAsync(
            It.Is<IEnumerable<BoletoEntrada>>(b => b.Single().DataVencimento == novo),
            It.IsAny<CancellationToken>()), Times.Once);
        _entradas.Verify(r => r.RemoverBoletos(
            It.Is<IEnumerable<BoletoEntrada>>(b => !b.Any())), Times.Once);
    }

    [Fact]
    public async Task DeveRemoverBoletos_QuandoListaVazia()
    {
        var entrada = EntradaSalva();
        entrada.AdicionarBoleto(DateTime.UtcNow.Date.AddDays(5));

        await _handler.Handle(Comando(entrada) with { DatasVencimentoBoleto = Array.Empty<DateTime>() }, CancellationToken.None);

        _entradas.Verify(r => r.RemoverBoletos(
            It.Is<IEnumerable<BoletoEntrada>>(b => b.Count() == 1)), Times.Once);
        entrada.Boletos.Should().BeEmpty();
    }
}
