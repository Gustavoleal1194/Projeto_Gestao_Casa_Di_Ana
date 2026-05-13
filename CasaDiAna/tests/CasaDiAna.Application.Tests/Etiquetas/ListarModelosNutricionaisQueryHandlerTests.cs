using CasaDiAna.Application.Etiquetas.Queries.ListarModelosNutricionais;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Etiquetas;

public class ListarModelosNutricionaisQueryHandlerTests
{
    private readonly Mock<IModeloEtiquetaNutricionalRepository> _modelos = new();
    private readonly ListarModelosNutricionaisQueryHandler _handler;

    public ListarModelosNutricionaisQueryHandlerTests()
    {
        _handler = new ListarModelosNutricionaisQueryHandler(_modelos.Object);
    }

    private static ModeloEtiquetaNutricional CriarModeloComProduto(Guid produtoId, string nomeProduto)
    {
        var modelo = ModeloEtiquetaNutricional.Criar(
            produtoId, "50g",
            200m, 836m, 30m, 10m, 5m, 8m, 6m, 2m, 0m, 3m, 120m,
            null, null);

        var produto = Produto.Criar(nomeProduto, 10m, Guid.NewGuid());
        typeof(ModeloEtiquetaNutricional)
            .GetProperty(nameof(ModeloEtiquetaNutricional.Produto))!
            .SetValue(modelo, produto);

        return modelo;
    }

    [Fact]
    public async Task DeveRetornarListaVazia_QuandoNenhumModeloCadastrado()
    {
        _modelos.Setup(r => r.ListarTodosAsync(default))
                .ReturnsAsync(Array.Empty<ModeloEtiquetaNutricional>());

        var resultado = await _handler.Handle(new ListarModelosNutricionaisQuery(), CancellationToken.None);

        resultado.Should().BeEmpty();
    }

    [Fact]
    public async Task DeveRetornarModelos_ComNomeDoProdutoCorreto()
    {
        var produtoId = Guid.NewGuid();
        var modelo = CriarModeloComProduto(produtoId, "Bolo de Chocolate");
        _modelos.Setup(r => r.ListarTodosAsync(default))
                .ReturnsAsync(new[] { modelo });

        var resultado = await _handler.Handle(new ListarModelosNutricionaisQuery(), CancellationToken.None);

        resultado.Should().HaveCount(1);
        resultado[0].ProdutoId.Should().Be(produtoId);
        resultado[0].ProdutoNome.Should().Be("Bolo de Chocolate");
        resultado[0].Porcao.Should().Be("50g");
        resultado[0].ValorEnergeticoKcal.Should().Be(200m);
    }

    [Fact]
    public async Task DeveMapearTodosOsCamposNutricionais()
    {
        var produtoId = Guid.NewGuid();
        var modelo = CriarModeloComProduto(produtoId, "Pão Integral");
        _modelos.Setup(r => r.ListarTodosAsync(default))
                .ReturnsAsync(new[] { modelo });

        var resultado = await _handler.Handle(new ListarModelosNutricionaisQuery(), CancellationToken.None);

        var dto = resultado[0];
        dto.Carboidratos.Should().Be(30m);
        dto.AcucaresTotais.Should().Be(10m);
        dto.AcucaresAdicionados.Should().Be(5m);
        dto.Proteinas.Should().Be(8m);
        dto.GordurasTotais.Should().Be(6m);
        dto.GordurasSaturadas.Should().Be(2m);
        dto.GordurasTrans.Should().Be(0m);
        dto.FibraAlimentar.Should().Be(3m);
        dto.Sodio.Should().Be(120m);
        dto.PorcoesPorEmbalagem.Should().BeNull();
        dto.MedidaCaseira.Should().BeNull();
    }
}
