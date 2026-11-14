using CasaDiAna.Application.Tests.Estoque;
using CasaDiAna.Application.VendasDiarias.Commands.RegistrarVenda;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.VendasDiarias;

public class RegistrarVendaCommandHandlerTests
{
    private readonly BaixaFichaTecnicaFixture _f = new();
    private readonly Mock<IVendaDiariaRepository> _vendas = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private VendaDiaria? _gravada;

    public RegistrarVendaCommandHandlerTests()
    {
        _vendas.Setup(r => r.AdicionarAsync(It.IsAny<VendaDiaria>(), default))
               .Callback<VendaDiaria, CancellationToken>((v, _) => _gravada = v)
               .Returns(Task.CompletedTask);
        _vendas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    private RegistrarVendaCommandHandler Criar(Produto produto)
    {
        _produtos.Setup(r => r.ObterPorIdComFichaAsync(produto.Id, default)).ReturnsAsync(produto);
        return new(_vendas.Object, _produtos.Object, _f.Servico(), _f.Usuario.Object);
    }

    [Fact]
    public async Task ProdutoFeitoNaHora_BaixaInsumosEDevolveCusto()
    {
        var cafe = _f.Ingrediente("Café", estoque: 500m, custoUnitario: 0.2m);
        var espresso = _f.Produto("Espresso", TipoProduto.FeitoNaHora, (cafe, 10m));

        var dto = await Criar(espresso).Handle(
            new RegistrarVendaCommand(espresso.Id, DateTime.Today, 5m), default);

        cafe.EstoqueAtual.Should().Be(450m);
        dto.CustoTotal.Should().Be(10m);
        _f.MovimentacoesGravadas.Should().ContainSingle(m =>
            m.Tipo == TipoMovimentacao.SaidaVenda && m.ReferenciaId == _gravada!.Id);
        _f.Notificacoes.Verify(n => n.VerificarECriarAsync(cafe, default), Times.Once);
    }

    [Fact]
    public async Task ProdutoProduzidoEmLote_RegistraVendaSemBaixa()
    {
        var farinha = _f.Ingrediente("Farinha", estoque: 10m, custoUnitario: 1m);
        var bolo = _f.Produto("Bolo", TipoProduto.Produzido, (farinha, 0.5m));

        var dto = await Criar(bolo).Handle(new RegistrarVendaCommand(bolo.Id, DateTime.Today, 2m), default);

        farinha.EstoqueAtual.Should().Be(10m);
        dto.CustoTotal.Should().BeNull();
        _gravada.Should().NotBeNull();
        _f.MovimentacoesGravadas.Should().BeEmpty();
    }
}
