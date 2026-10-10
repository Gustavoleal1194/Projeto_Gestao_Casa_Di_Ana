using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ClassificadorLinhaVendaTests
{
    [Theory]
    [InlineData("TAXA DE SERVIÇO")]
    [InlineData("taxa servico")]
    [InlineData("Taxa de Serviço 10%")]
    [InlineData("  Taxa  Serviço")]
    [InlineData("taxa de servico")]
    public void TaxaDeServico_ClassificadaComoTaxaServico(string nome) =>
        ClassificadorLinhaVenda.ClassificarRepasse(nome).Should().Be(TipoRepasse.TaxaServico);

    [Theory]
    [InlineData("Entrega longe")]
    [InlineData("Entrega perto")]
    [InlineData("ENTREGA")]
    [InlineData("Taxa de entrega")]
    [InlineData("Taxa entrega")]
    public void Entrega_ClassificadaComoEntrega(string nome) =>
        ClassificadorLinhaVenda.ClassificarRepasse(nome).Should().Be(TipoRepasse.Entrega);

    [Theory]
    [InlineData("Bacon")]
    [InlineData("Bacon - Acrescimo")]
    [InlineData("Nutella - Acréscimo")]
    [InlineData("Diversos - Valor R$ 25,00")]
    [InlineData("Torta de entrega especial")] // "entrega" no meio não conta
    [InlineData("Taxa de embalagem")]
    [InlineData("Taxa de rolha")]
    public void Produto_NaoEhRepasse(string nome) =>
        ClassificadorLinhaVenda.ClassificarRepasse(nome).Should().BeNull();
}
