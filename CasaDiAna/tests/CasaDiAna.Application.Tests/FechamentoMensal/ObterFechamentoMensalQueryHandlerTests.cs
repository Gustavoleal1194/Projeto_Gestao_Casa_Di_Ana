using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class ObterFechamentoMensalQueryHandlerTests
{
    private readonly Mock<IVendaDiariaRepository> _vendas = new();
    private readonly Mock<IDespesaFixaRepository> _despesas = new();
    private readonly Mock<IFaturamentoMensalRepository> _faturamento = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly DateTime _comp = new(2026, 6, 1);

    private ObterFechamentoMensalQueryHandler Criar() =>
        new(_vendas.Object, _despesas.Object, _faturamento.Object, _produtos.Object);

    // Produto com preço 10 e sem ficha técnica → custo direto 0.
    private static Produto ProdutoSimples(decimal preco)
        => Produto.Criar("Café", preco, Guid.NewGuid());

    [Fact]
    public async Task DeveCalcularFaturamentoMargensEPercentual()
    {
        var produto = ProdutoSimples(10m);
        var venda = VendaDiaria.Criar(produto.Id, new DateTime(2026, 6, 10), 100m, Guid.NewGuid());

        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria> { venda });
        _produtos.Setup(r => r.ListarComFichaAsync(false, default))
                 .ReturnsAsync(new List<Produto> { produto });
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default))
                 .ReturnsAsync(new List<DespesaFixa>
                 {
                     DespesaFixa.Criar(_comp, CategoriaDespesaFixa.Aluguel, null, 200m, null, _comp, Guid.NewGuid()),
                     DespesaFixa.Criar(_comp, CategoriaDespesaFixa.FolhaPagamento, null, 300m, null, _comp, Guid.NewGuid()),
                 });
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default))
                    .ReturnsAsync((FaturamentoMensal?)null);

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        _vendas.Verify(r => r.ListarAsync(
            new DateTime(2026, 6, 1),
            new DateTime(2026, 6, 30),
            null,
            default), Times.Once);

        dto.FaturamentoCalculado.Should().Be(1000m);   // 100 × 10
        dto.FaturamentoUsado.Should().Be(1000m);
        dto.CustoDiretoTotal.Should().Be(0m);           // sem ficha
        dto.TotalDespesasFixas.Should().Be(500m);
        dto.FolhaPagamento.Should().Be(300m);
        dto.DespesaFixaPercentual.Should().Be(0.5m);    // 500 / 1000
        dto.MargemBruta.Should().Be(1000m);
        dto.MargemOperacional.Should().Be(500m);        // 1000 − 0 − 500
        dto.PrimeCost.Should().Be(300m);                // 0 + 300
    }

    [Fact]
    public async Task DeveUsarFaturamentoManual_QuandoDefinido()
    {
        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria>());
        _produtos.Setup(r => r.ListarComFichaAsync(false, default)).ReturnsAsync(new List<Produto>());
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default)).ReturnsAsync(new List<DespesaFixa>());
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default))
                    .ReturnsAsync(FaturamentoMensal.Criar(_comp, 8000m, Guid.NewGuid()));

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoCalculado.Should().Be(0m);
        dto.FaturamentoManual.Should().Be(8000m);
        dto.FaturamentoUsado.Should().Be(8000m);
    }

    [Fact]
    public async Task DespesaFixaPercentual_DeveSerNull_QuandoFaturamentoZero()
    {
        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria>());
        _produtos.Setup(r => r.ListarComFichaAsync(false, default)).ReturnsAsync(new List<Produto>());
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default))
                 .ReturnsAsync(new List<DespesaFixa>
                 {
                     DespesaFixa.Criar(_comp, CategoriaDespesaFixa.Energia, null, 800m, null, _comp, Guid.NewGuid()),
                 });
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default)).ReturnsAsync((FaturamentoMensal?)null);

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoUsado.Should().Be(0m);
        dto.DespesaFixaPercentual.Should().BeNull();
    }
}
