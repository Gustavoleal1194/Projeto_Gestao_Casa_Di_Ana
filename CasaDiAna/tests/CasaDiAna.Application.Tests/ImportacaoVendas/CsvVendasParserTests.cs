using System.Text;
using CasaDiAna.Infrastructure.Services;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class CsvVendasParserTests
{
    private static readonly string Header = "Cód Produto;Nome;Tipo Preço;Val. Unit;Qtde;Total Venda";
    private readonly CsvVendasParser _parser = new();

    private static byte[] MakeBytes(IEnumerable<string> rows, bool withBom = false)
    {
        var lines = new[] { Header }.Concat(rows);
        var text = (withBom ? "\uFEFF" : "") + string.Join("\n", lines);
        return Encoding.UTF8.GetBytes(text);
    }

    [Fact]
    public void Parse_LinhaSimples_ParseaCorretamente()
    {
        var bytes = MakeBytes(["65;Pao multigraos - Grande;A Vista;36,28;62;2249,38"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].Nome.Should().Be("Pao multigraos - Grande");
        result.Linhas[0].Quantidade.Should().Be(62m);
        result.Linhas[0].ValorTotal.Should().Be(2249.38m);
        result.Linhas[0].CodigoExterno.Should().BeNull();
        result.Linhas[0].Grupo.Should().BeNull();
    }

    [Fact]
    public void Parse_NomeComRSNoMeio_PreservadoInteiro()
    {
        var bytes = MakeBytes(["88;Diversos - Valor R$ 25,00;A Vista;36,05;11;396,57"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].Nome.Should().Be("Diversos - Valor R$ 25,00");
        result.Linhas[0].Quantidade.Should().Be(11m);
    }

    [Fact]
    public void Parse_TaxaDeServico_Ignorada()
    {
        var bytes = MakeBytes(["77;TAXA DE SERVIÇO;Indefinido;9,04;411;3719,4"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().BeEmpty();
    }

    [Fact]
    public void Parse_EntregaLonge_Ignorada()
    {
        var bytes = MakeBytes(["50;Entrega longe;Indefinido;10,00;5;50,00"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().BeEmpty();
    }

    [Fact]
    public void Parse_Bacon_Importado()
    {
        var bytes = MakeBytes(["1;Bacon;A Vista;3,00;29;87,00"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].Nome.Should().Be("Bacon");
        result.Linhas[0].Quantidade.Should().Be(29m);
    }

    [Fact]
    public void Parse_BaconAcrescimo_Importado()
    {
        var bytes = MakeBytes(["2;Bacon - Acrescimo;A Vista;3,00;10;30,00"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].Nome.Should().Be("Bacon - Acrescimo");
    }

    [Fact]
    public void Parse_DecimalComVirgula_TotalCorreto()
    {
        var bytes = MakeBytes(["194;Torta folhada de morango;A Vista;34,7;2;69,4"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].ValorTotal.Should().Be(69.4m);
        result.Linhas[0].Quantidade.Should().Be(2m);
    }

    [Fact]
    public void Parse_BomNoInicio_Ignorado_CabecalhoReconhecido()
    {
        var bytes = MakeBytes(["65;Croissant de Presunto;A Vista;12,00;10;120,00"], withBom: true);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].Nome.Should().Be("Croissant de Presunto");
    }

    [Fact]
    public void Parse_MultiplasLinhas_TaxaFiltrada_RestanteImportado()
    {
        var bytes = MakeBytes([
            "164;Tortinha folhada de Pistache c/framboesa;A Vista;35;5;175",
            "88;Diversos - Valor R$ 25,00;A Vista;36,05;11;396,57",
            "77;TAXA DE SERVIÇO;Indefinido;9,04;411;3719,4",
        ]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(2);
        result.Linhas.Should().NotContain(l => l.Nome.StartsWith("TAXA"));
        result.Linhas[0].Nome.Should().Be("Tortinha folhada de Pistache c/framboesa");
        result.Linhas[0].Quantidade.Should().Be(5m);
        result.Linhas[0].ValorTotal.Should().Be(175m);
    }

    [Fact]
    public void Parse_ChasEOutrasBebidas_EPreservado()
    {
        var bytes = MakeBytes(["3;Chas e Outras Bebidas Quentes - Bia (Matcha) - Leite Vegetal;A Vista;8,00;7;56,00"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].Nome.Should().Be("Chas e Outras Bebidas Quentes - Bia (Matcha) - Leite Vegetal");
        result.Linhas[0].Quantidade.Should().Be(7m);
    }

    [Fact]
    public void Parse_FarinhaPizzaEFocaccia_EPreservado()
    {
        var bytes = MakeBytes(["4;Farinha italiana PIZZA E FOCACCIA;A Vista;8,00;5;40,00"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].Nome.Should().Be("Farinha italiana PIZZA E FOCACCIA");
    }

    [Fact]
    public void Parse_DecimalComMilhar_TotalCorreto()
    {
        var bytes = MakeBytes(["65;Pao multigraos - Grande;A Vista;36,29;59;2.141,38"]);

        var result = _parser.Parse(bytes);

        result.Linhas.Should().HaveCount(1);
        result.Linhas[0].ValorTotal.Should().Be(2141.38m);
        result.Linhas[0].Quantidade.Should().Be(59m);
    }

    [Fact]
    public void IsIgnorado_SoTaxaEEntrega()
    {
        CsvVendasParser.IsIgnorado("TAXA DE SERVIÇO").Should().BeTrue();
        CsvVendasParser.IsIgnorado("taxa servico").Should().BeTrue();
        CsvVendasParser.IsIgnorado("Entrega longe").Should().BeTrue();
        CsvVendasParser.IsIgnorado("Entrega perto").Should().BeTrue();
        CsvVendasParser.IsIgnorado("Bacon").Should().BeFalse();
        CsvVendasParser.IsIgnorado("Bacon - Acrescimo").Should().BeFalse();
        CsvVendasParser.IsIgnorado("Nutella - Acréscimo").Should().BeFalse();
        CsvVendasParser.IsIgnorado("Diversos - Valor R$ 25,00").Should().BeFalse();
    }

    [Fact]
    public void Parse_HashGerado_NaoVazio()
    {
        var bytes = MakeBytes(["1;Produto;A Vista;10,00;1;10,00"]);

        var result = _parser.Parse(bytes);

        result.Hash.Should().NotBeNullOrEmpty();
        result.Hash.Should().HaveLength(64); // SHA256 hex = 64 chars
    }

    [Fact]
    public void Parse_PeriodoSempReNull_CsvNaoTemPeriodo()
    {
        var bytes = MakeBytes(["1;Produto;A Vista;10,00;1;10,00"]);

        var result = _parser.Parse(bytes);

        result.PeriodoDe.Should().BeNull();
        result.PeriodoAte.Should().BeNull();
    }
}
