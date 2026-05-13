using CasaDiAna.Application.Etiquetas.Commands.SalvarModeloNutricional;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Etiquetas;

public class SalvarModeloNutricionalCommandHandlerTests
{
    private readonly Mock<IModeloEtiquetaNutricionalRepository> _modelos = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly SalvarModeloNutricionalCommandHandler _handler;

    public SalvarModeloNutricionalCommandHandlerTests()
    {
        _handler = new SalvarModeloNutricionalCommandHandler(_modelos.Object, _produtos.Object);
    }

    private static SalvarModeloNutricionalCommand CriarCommand(Guid produtoId) => new(
        ProdutoId: produtoId,
        Porcao: "50g",
        ValorEnergeticoKcal: 200m,
        ValorEnergeticoKJ: 836m,
        Carboidratos: 30m,
        AcucaresTotais: 10m,
        AcucaresAdicionados: 5m,
        Proteinas: 8m,
        GordurasTotais: 6m,
        GordurasSaturadas: 2m,
        GordurasTrans: 0m,
        FibraAlimentar: 3m,
        Sodio: 120m,
        PorcoesPorEmbalagem: 4,
        MedidaCaseira: "1 fatia",
        VdValorEnergetico: "25",
        VdCarboidratos: "10",
        VdAcucaresAdicionados: null,
        VdProteinas: "16",
        VdGordurasTotais: "11",
        VdGordurasSaturadas: "9",
        VdGordurasTrans: null,
        VdFibraAlimentar: "12",
        VdSodio: "5");

    private static ModeloEtiquetaNutricional CriarModeloExistente(Guid produtoId) =>
        ModeloEtiquetaNutricional.Criar(
            produtoId, "100g",
            150m, 627m, 25m, 8m, 4m, 6m, 5m, 1m, 0m, 2m, 80m,
            null, null);

    [Fact]
    public async Task DeveLancarDomainException_QuandoProdutoNaoEncontrado()
    {
        var produtoId = Guid.NewGuid();
        _produtos.Setup(r => r.ExisteAsync(produtoId, default)).ReturnsAsync(false);

        var acao = () => _handler.Handle(CriarCommand(produtoId), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Produto não encontrado.");
    }

    [Fact]
    public async Task DeveCriarNovoModelo_QuandoProdutoExisteSemModeloAnterior()
    {
        var produtoId = Guid.NewGuid();
        _produtos.Setup(r => r.ExisteAsync(produtoId, default)).ReturnsAsync(true);
        _modelos.Setup(r => r.ObterPorProdutoIdAsync(produtoId, default))
                .ReturnsAsync((ModeloEtiquetaNutricional?)null);
        _modelos.Setup(r => r.AdicionarAsync(It.IsAny<ModeloEtiquetaNutricional>(), default))
                .Returns(Task.CompletedTask);
        _modelos.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(CriarCommand(produtoId), CancellationToken.None);

        resultado.ProdutoId.Should().Be(produtoId);
        resultado.Porcao.Should().Be("50g");
        resultado.ValorEnergeticoKcal.Should().Be(200m);
        _modelos.Verify(r => r.AdicionarAsync(It.IsAny<ModeloEtiquetaNutricional>(), default), Times.Once);
        _modelos.Verify(r => r.SalvarAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeveAtualizarModeloExistente_SemCriarNovoRegistro()
    {
        var produtoId = Guid.NewGuid();
        _produtos.Setup(r => r.ExisteAsync(produtoId, default)).ReturnsAsync(true);
        _modelos.Setup(r => r.ObterPorProdutoIdAsync(produtoId, default))
                .ReturnsAsync(CriarModeloExistente(produtoId));
        _modelos.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(CriarCommand(produtoId), CancellationToken.None);

        resultado.Porcao.Should().Be("50g");
        resultado.ValorEnergeticoKcal.Should().Be(200m);
        resultado.Sodio.Should().Be(120m);
        resultado.PorcoesPorEmbalagem.Should().Be(4);
        resultado.MedidaCaseira.Should().Be("1 fatia");
        resultado.VdValorEnergetico.Should().Be("25");
        resultado.VdCarboidratos.Should().Be("10");
        resultado.VdAcucaresAdicionados.Should().BeNull();
        resultado.VdProteinas.Should().Be("16");
        _modelos.Verify(r => r.AdicionarAsync(It.IsAny<ModeloEtiquetaNutricional>(), default), Times.Never);
        _modelos.Verify(r => r.SalvarAsync(default), Times.Once);
    }
}
