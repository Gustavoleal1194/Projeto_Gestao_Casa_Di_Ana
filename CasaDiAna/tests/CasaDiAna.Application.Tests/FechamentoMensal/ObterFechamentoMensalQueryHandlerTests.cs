using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using CasaDiAna.Application.Tests.Despesas;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class ObterFechamentoMensalQueryHandlerTests
{
    private readonly Mock<IVendaDiariaRepository> _vendas = new();
    private readonly Mock<IDespesaRepository> _despesas = new();
    private readonly Mock<IFaturamentoMensalRepository> _faturamento = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly DateTime _comp = new(2026, 6, 1);

    private ObterFechamentoMensalQueryHandler Criar() =>
        new(_vendas.Object, _despesas.Object, _faturamento.Object, _produtos.Object, _entradas.Object);

    [Fact]
    public async Task DeveSepararFixasVariaveis_ComprasETotalSaidas()
    {
        var produto = Produto.Criar("Café", 10m, Guid.NewGuid());
        var venda = VendaDiaria.Criar(produto.Id, new DateTime(2026, 6, 10), 100m, Guid.NewGuid());
        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria> { venda });
        _produtos.Setup(r => r.ListarComFichaAsync(false, default)).ReturnsAsync(new List<Produto> { produto });

        var catFixa = CategoriaDespesa.Criar("Aluguel", TipoDespesa.Fixa, false, Guid.NewGuid());
        var catFixaFolha = CategoriaDespesa.Criar("Folha de pagamento", TipoDespesa.Fixa, true, Guid.NewGuid());
        var catVar = CategoriaDespesa.Criar("Taxa de cartão", TipoDespesa.Variavel, false, Guid.NewGuid());

        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default)).ReturnsAsync(new List<Despesa>
        {
            DespesaTestFactory.ComCategoria(_comp, catFixa, 200m),
            DespesaTestFactory.ComCategoria(_comp, catFixaFolha, 300m),
            DespesaTestFactory.ComCategoria(_comp, catVar, 100m),
        });
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default)).ReturnsAsync((FaturamentoMensal?)null);

        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), new DateTime(2026, 6, 5), Guid.NewGuid());
        entrada.AdicionarItem(Guid.NewGuid(), 4m, 50m); // 200 compras
        _entradas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), default))
                 .ReturnsAsync(new List<EntradaMercadoria> { entrada });

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoUsado.Should().Be(1000m);
        dto.TotalDespesasFixas.Should().Be(500m);
        dto.TotalDespesasVariaveis.Should().Be(100m);
        dto.TotalCompras.Should().Be(200m);
        dto.TotalSaidas.Should().Be(800m);           // 500 + 100 + 200
        dto.DespesaFixaPercentual.Should().Be(0.5m); // só fixas / faturamento
        dto.MargemOperacional.Should().Be(400m);     // 1000 - 0 - 500 - 100
        dto.PrimeCost.Should().Be(300m);             // custo direto 0 + folha 300
    }

    [Fact]
    public async Task DeveUsarFaturamentoManual_QuandoDefinido()
    {
        _vendas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, default))
               .ReturnsAsync(new List<VendaDiaria>());
        _produtos.Setup(r => r.ListarComFichaAsync(false, default)).ReturnsAsync(new List<Produto>());
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default)).ReturnsAsync(new List<Despesa>());
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default))
                    .ReturnsAsync(FaturamentoMensal.Criar(_comp, 8000m, Guid.NewGuid()));
        _entradas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), default))
                 .ReturnsAsync(new List<EntradaMercadoria>());

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

        var catFixa = CategoriaDespesa.Criar("Energia", TipoDespesa.Fixa, false, Guid.NewGuid());
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default))
                 .ReturnsAsync(new List<Despesa>
                 {
                     DespesaTestFactory.ComCategoria(_comp, catFixa, 800m),
                 });
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default)).ReturnsAsync((FaturamentoMensal?)null);
        _entradas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), default))
                 .ReturnsAsync(new List<EntradaMercadoria>());

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoUsado.Should().Be(0m);
        dto.DespesaFixaPercentual.Should().BeNull();
    }
}
