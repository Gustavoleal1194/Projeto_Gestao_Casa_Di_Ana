using CasaDiAna.Application.VendasDiarias.Dtos;
using CasaDiAna.Application.VendasDiarias.Queries.RelatorioProducaoVendas;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Producao = CasaDiAna.Domain.Entities.ProducaoDiaria;
using Venda = CasaDiAna.Domain.Entities.VendaDiaria;

namespace CasaDiAna.Application.Tests.VendasDiarias;

public class RelatorioProducaoVendasQueryHandlerTests
{
    private static readonly DateTime Dia = new(2026, 10, 10);
    private static readonly Guid Usuario = Guid.NewGuid();

    private static async Task<RelatorioProducaoVendasItemDto> GerarItemAsync(
        Produto produto,
        IReadOnlyList<Producao> producoes,
        IReadOnlyList<Venda> vendas)
    {
        var relatorio = await GerarRelatorioAsync(new[] { produto }, producoes, vendas);
        return relatorio.Itens.Should().ContainSingle().Subject;
    }

    private static async Task<RelatorioProducaoVendasDto> GerarRelatorioAsync(
        IReadOnlyList<Produto> produtos,
        IReadOnlyList<Producao> producoes,
        IReadOnlyList<Venda> vendas)
    {
        var producoesRepo = new Mock<IProducaoDiariaRepository>();
        producoesRepo.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<IReadOnlyList<Guid>?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(producoes);

        var vendasRepo = new Mock<IVendaDiariaRepository>();
        vendasRepo.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<IReadOnlyList<Guid>?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(vendas);

        var produtosRepo = new Mock<IProdutoRepository>();
        produtosRepo.Setup(r => r.ListarComFichaAsync(false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(produtos);

        var handler = new RelatorioProducaoVendasQueryHandler(
            producoesRepo.Object, vendasRepo.Object, produtosRepo.Object);

        return await handler.Handle(
            new RelatorioProducaoVendasQuery(Dia, Dia), CancellationToken.None);
    }

    [Fact]
    public async Task DeveUsarCustoDaFicha_QuandoProdutoVendidoNaoFoiProduzido()
    {
        // Bebida de revenda: não tem produção diária, o custo vem do cadastro.
        var produto = Produto.Criar("Coca-Cola KS", 8m, Usuario, tipo: TipoProduto.Revenda);
        produto.DefinirCustoUnitario(2.59m);

        var item = await GerarItemAsync(produto, Array.Empty<Producao>(),
            new[] { Venda.Criar(produto.Id, Dia, 10, Usuario) });

        item.CustoMedioUnitario.Should().Be(2.59m);
        item.MargemLucro.Should().Be((8m - 2.59m) / 8m * 100);
    }

    [Fact]
    public async Task DeveRetornarMargemNula_QuandoProdutoNaoTemCustoCadastrado()
    {
        // Sem custo, a margem é desconhecida: exibir 100% esconderia a falta de ficha.
        var produto = Produto.Criar("Sem ficha", 10m, Usuario);

        var item = await GerarItemAsync(produto, Array.Empty<Producao>(),
            new[] { Venda.Criar(produto.Id, Dia, 3, Usuario) });

        item.MargemLucro.Should().BeNull();
    }

    [Fact]
    public async Task DeveUsarCustoDaProducao_QuandoHouveProducaoNoPeriodo()
    {
        var produto = Produto.Criar("Croissant", 10m, Usuario);

        var item = await GerarItemAsync(produto,
            new[] { Producao.Criar(produto.Id, Dia, 4, custoTotal: 20m, Usuario) },
            new[] { Venda.Criar(produto.Id, Dia, 4, Usuario) });

        item.CustoMedioUnitario.Should().Be(5m);
        item.MargemLucro.Should().Be(50m);
    }

    [Fact]
    public async Task Resumo_DeveCalcularLucroSobreCustoDasVendas_IgnorandoProdutosSemCusto()
    {
        var coca = Produto.Criar("Coca-Cola KS", 8m, Usuario, tipo: TipoProduto.Revenda);
        coca.DefinirCustoUnitario(2m);
        var croissant = Produto.Criar("Croissant", 10m, Usuario);
        var semFicha = Produto.Criar("Sem ficha", 50m, Usuario);

        var relatorio = await GerarRelatorioAsync(
            new[] { coca, croissant, semFicha },
            // 5 croissants a R$ 4 cada: 4 vendidos, 1 perdido.
            new[] { Producao.Criar(croissant.Id, Dia, 5, custoTotal: 20m, Usuario) },
            new[]
            {
                Venda.Criar(coca.Id, Dia, 10, Usuario),
                Venda.Criar(croissant.Id, Dia, 4, Usuario),
                Venda.Criar(semFicha.Id, Dia, 2, Usuario),
            });

        var resumo = relatorio.Resumo;
        resumo.ReceitaTotal.Should().Be(220m);       // 80 + 40 + 100
        resumo.ReceitaComCusto.Should().Be(120m);    // sem a receita do produto sem ficha
        resumo.CustoVendas.Should().Be(36m);         // 10 × 2 + 4 × 4
        resumo.CustoPerda.Should().Be(4m);           // a perda conta uma vez só
        resumo.LucroEstimado.Should().Be(80m);       // 120 − 36 − 4
        resumo.MargemGeral.Should().Be(80m / 120m * 100);
        resumo.ProdutosVendidos.Should().Be(3);
        resumo.ProdutosVendidosComCusto.Should().Be(2);
    }

    [Fact]
    public async Task Resumo_DeveRetornarMargemNula_QuandoNenhumProdutoVendidoTemCusto()
    {
        var produto = Produto.Criar("Sem ficha", 10m, Usuario);

        var relatorio = await GerarRelatorioAsync(new[] { produto }, Array.Empty<Producao>(),
            new[] { Venda.Criar(produto.Id, Dia, 3, Usuario) });

        relatorio.Resumo.ReceitaTotal.Should().Be(30m);
        relatorio.Resumo.LucroEstimado.Should().Be(0m);
        relatorio.Resumo.MargemGeral.Should().BeNull();
    }
}
