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
        resultado[0].CodigoExterno.Should().BeNull();
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

    [Fact]
    public void ParseLines_FormatoPDVReal_TresNumerosFinal_ParseaCorretamente()
    {
        // Linha real do PDV: Cód  Nome  Tipo Preço  Val. Unit  Qtde  Total Venda
        var linhas = new List<string>
        {
            "PADARIA",
            "65  Pao multigraos - Grande  A Vista  R$ 36,29  59  R$ 2.141,38",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].CodigoExterno.Should().BeNull();
        resultado[0].Nome.Should().Be("Pao multigraos - Grande");
        resultado[0].Quantidade.Should().Be(59m);
        resultado[0].ValorTotal.Should().Be(2141.38m);
    }

    [Fact]
    public void ParseLines_CabecalhoColunasPDVIgnorado()
    {
        var linhas = new List<string>
        {
            "Cód Produto  Nome  Tipo Preço  Val. Unit  Qtde  Total Venda",
            "65  Pao multigraos - Grande  A Vista  R$ 36,29  59  R$ 2.141,38",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
    }

    [Fact]
    public void ParseLines_BriocheDeCreme_NomeCompleto()
    {
        // "de" e "creme" chegam como tokens separados por duplo espaço do PdfPig
        var linhas = new List<string>
        {
            "Bar",
            "189  Brioche  de  creme  A Vista  35,00  1  35,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].Nome.Should().Be("Brioche de creme");
        resultado[0].Quantidade.Should().Be(1m);
        resultado[0].ValorTotal.Should().Be(35m);
    }

    [Fact]
    public void ParseLines_NomeComPreposicoes_NaoCorta()
    {
        // Preposições curtas (≤2 chars) devem ser coladas ao token anterior
        var linhas = new List<string>
        {
            "Bar",
            "156  Torta  folhada  de  pera  c/amêndoas  A Vista  30,00  14  420,00",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].Nome.Should().Be("Torta folhada de pera c/amêndoas");
        resultado[0].Quantidade.Should().Be(14m);
        resultado[0].ValorTotal.Should().Be(420m);
    }

    [Fact]
    public void ParseLines_NomeMultilinha_Reconstituido()
    {
        // Nome longo quebrado em duas linhas físicas no PDF
        var linhas = new List<string>
        {
            "Bar",
            "3  Especialidades com Cafe - Dani (Mocha: Espresso, Leite e Ganache",
            "de Chocolate)  A Vista  16,71  176  2.940,45",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
        resultado[0].Nome.Should().Be("Especialidades com Cafe - Dani (Mocha: Espresso, Leite e Ganache de Chocolate)");
        resultado[0].Quantidade.Should().Be(176m);
        resultado[0].ValorTotal.Should().Be(2940.45m);
    }

    [Fact]
    public void ParseLines_SecaoMinuscula_Reconhecida()
    {
        // "Indefinido" é seção com inicial maiúscula e resto minúsculo
        // TAXA DE SERVIÇO com tipo "Indefinido" deve ser ignorado (IsIgnorado via StartsWith "taxa")
        var linhas = new List<string>
        {
            "Indefinido",
            "77  TAXA DE SERVIÇO  Indefinido  8,91  371  3.306,70",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(0);
    }

    [Fact]
    public void ParseLines_LinhaRegistrosIgnorada()
    {
        // Linhas "Padaria 14 registros" são rodapés de seção, não produtos
        var linhas = new List<string>
        {
            "Padaria 14 registros",
            "65  Pao multigraos - Grande  A Vista  36,29  59  2.141,38",
        };

        var resultado = PdfVendasParser.ParseLines(linhas, out _, out _);

        resultado.Should().HaveCount(1);
    }
}
