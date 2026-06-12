using CasaDiAna.Application.Despesas.Queries.ObterComprasMes;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using CategoriaDespesaEnum = CasaDiAna.Domain.Enums.CategoriaDespesa;

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

        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default)).ReturnsAsync(new List<Despesa>
        {
            Despesa.Criar(_comp, TipoDespesa.Fixa, CategoriaDespesaEnum.Aluguel, null, 200m, null, _comp, Guid.NewGuid()),
            Despesa.Criar(_comp, TipoDespesa.Fixa, CategoriaDespesaEnum.FolhaPagamento, null, 300m, null, _comp, Guid.NewGuid()),
            Despesa.Criar(_comp, TipoDespesa.Variavel, CategoriaDespesaEnum.TaxaCartao, null, 100m, null, _comp, Guid.NewGuid()),
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
        _despesas.Setup(r => r.ListarPorCompetenciaAsync(_comp, default))
                 .ReturnsAsync(new List<Despesa>
                 {
                     Despesa.Criar(_comp, TipoDespesa.Fixa, CategoriaDespesaEnum.Energia, null, 800m, null, _comp, Guid.NewGuid()),
                 });
        _faturamento.Setup(r => r.ObterPorCompetenciaAsync(_comp, default)).ReturnsAsync((FaturamentoMensal?)null);
        _entradas.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), default))
                 .ReturnsAsync(new List<EntradaMercadoria>());

        var dto = await Criar().Handle(new ObterFechamentoMensalQuery(_comp), CancellationToken.None);

        dto.FaturamentoUsado.Should().Be(0m);
        dto.DespesaFixaPercentual.Should().BeNull();
    }
}
