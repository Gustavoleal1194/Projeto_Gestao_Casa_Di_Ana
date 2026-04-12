using CasaDiAna.Infrastructure.Services;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class PdfVendasParserTests
{
    [Fact]
    public void ParseLines_LinhaSimples_RetornaLinha()
    {
        var linhas = new List<string>
        {
            "PADARIA",
            "001  Croissant de Presunto  12,000  150,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].Nome.Should().Be("Croissant de Presunto");
        resultado[0].CodigoExterno.Should().Be("001");
        resultado[0].Quantidade.Should().Be(12m);
        resultado[0].ValorTotal.Should().Be(150m);
        resultado[0].Grupo.Should().Be("PADARIA");
    }

    [Fact]
    public void ParseLines_LinhaSemCodigo_RetornaLinha()
    {
        var linhas = new List<string>
        {
            "BAR",
            "Café Expresso  45,000  225,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].CodigoExterno.Should().BeNull();
        resultado[0].Nome.Should().Be("Café Expresso");
        resultado[0].Grupo.Should().Be("BAR");
    }

    [Fact]
    public void ParseLines_LinhaTotalIgnorada()
    {
        var linhas = new List<string>
        {
            "001  Pão de Mel  5,000  50,00",
            "TOTAL PADARIA  5,000  50,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].Nome.Should().Be("Pão de Mel");
    }

    [Fact]
    public void ParseLines_CabecalhoPaginaIgnorado()
    {
        var linhas = new List<string>
        {
            "MOVIMENTAÇÃO DE PRODUTOS - SINTÉTICO",
            "Cód.  Descrição  Qtd.  Valor",
            "001  Brigadeiro  10,000  80,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
    }

    [Fact]
    public void ParseLines_ExtraiPeriodo()
    {
        var linhas = new List<string>
        {
            "Período: 01/04/2026 à 30/04/2026",
            "001  Produto X  5,000  50,00",
        };

        PdfVendasParser.ParseLines(linhas, out var de, out var ate);

        de.Should().Be("2026-04-01");
        ate.Should().Be("2026-04-30");
    }

    [Fact]
    public void ParseLines_SecaoAlteraGrupoDeLinhaSeguinte()
    {
        var linhas = new List<string>
        {
            "COZINHA",
            "001  Frango Grelhado  8,000  120,00",
            "BAR",
            "002  Suco de Laranja  20,000  100,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(2);
        resultado[0].Grupo.Should().Be("COZINHA");
        resultado[1].Grupo.Should().Be("BAR");
    }

    [Fact]
    public void Normalizar_RemoveDiacriticos()
    {
        PdfVendasParser.Normalizar("Pão de Mel").Should().Be("pao de mel");
        PdfVendasParser.Normalizar("CAFÉ EXPRESSO").Should().Be("cafe expresso");
        PdfVendasParser.Normalizar("Frango-Grelhado").Should().Be("frango grelhado");
    }

    [Fact]
    public void IsIgnorado_DetectaItensIgnorados()
    {
        PdfVendasParser.IsIgnorado("TAXA DE SERVIÇO").Should().BeTrue();
        PdfVendasParser.IsIgnorado("Entrega").Should().BeTrue();
        PdfVendasParser.IsIgnorado("Brigadeiro").Should().BeFalse();
    }
}
