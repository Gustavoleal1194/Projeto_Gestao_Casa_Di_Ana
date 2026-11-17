using CasaDiAna.Application.Relatorios.Queries.InsumosProducao;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Producao = CasaDiAna.Domain.Entities.ProducaoDiaria;

namespace CasaDiAna.Application.Tests.Relatorios;

public class InsumosProducaoQueryHandlerTests
{
    private static readonly DateTime Ontem = new(2026, 11, 29);
    private static readonly DateTime Hoje = new(2026, 11, 30);

    private readonly Mock<IMovimentacaoRepository> _movimentacoes = new();
    private readonly Mock<IIngredienteRepository> _ingredientes = new();
    private readonly Mock<IProducaoDiariaRepository> _producoes = new();
    private readonly InsumosProducaoQueryHandler _handler;

    private readonly Guid _usuarioId = Guid.NewGuid();
    private readonly Ingrediente _farinha;
    private readonly Ingrediente _acucar;

    public InsumosProducaoQueryHandlerTests()
    {
        _farinha = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        _acucar = Ingrediente.Criar("Açúcar", 1, 0, _usuarioId);
        _ingredientes.Setup(r => r.ObterPorIdAsync(_farinha.Id, It.IsAny<CancellationToken>())).ReturnsAsync(_farinha);
        _ingredientes.Setup(r => r.ObterPorIdAsync(_acucar.Id, It.IsAny<CancellationToken>())).ReturnsAsync(_acucar);

        _handler = new InsumosProducaoQueryHandler(_movimentacoes.Object, _ingredientes.Object, _producoes.Object);
    }

    private Producao ProducaoEm(DateTime data) => Producao.Criar(Guid.NewGuid(), data, 10m, _usuarioId);

    private Movimentacao SaidaDe(Ingrediente ingrediente, Producao producao, decimal quantidade) =>
        Movimentacao.Criar(ingrediente.Id, TipoMovimentacao.SaidaProducao, quantidade, 0m, _usuarioId,
            "ProducaoDiaria", producao.Id);

    private void Cenario(IReadOnlyList<Producao> producoes, IReadOnlyList<Movimentacao> movimentacoes)
    {
        _producoes.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<IReadOnlyList<Guid>?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(producoes);
        _movimentacoes.Setup(r => r.ListarPorReferenciasAsync(TipoMovimentacao.SaidaProducao,
                It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(movimentacoes);
    }

    [Fact]
    public async Task DeveDatarPelaProducao_QuandoLancadaNoDiaSeguinte()
    {
        // Movimentação criada "agora" (hoje), mas a produção é de ontem
        var producao = ProducaoEm(Ontem);
        Cenario([producao], [SaidaDe(_farinha, producao, 2m)]);

        var resultado = await _handler.Handle(new InsumosProducaoQuery(Ontem, Ontem), CancellationToken.None);

        resultado.Should().ContainSingle()
            .Which.Data.Should().Be(DateOnly.FromDateTime(Ontem));
    }

    [Fact]
    public async Task DeveBuscarProducoesPeloPeriodo_ESaidasApenasDelas()
    {
        var produtoId = Guid.NewGuid();
        var producao = ProducaoEm(Hoje);
        Cenario([producao], []);

        await _handler.Handle(new InsumosProducaoQuery(Ontem, Hoje, ProdutoIds: [produtoId]), CancellationToken.None);

        _producoes.Verify(r => r.ListarAsync(Ontem, Hoje,
            It.Is<IReadOnlyList<Guid>?>(ids => ids!.Single() == produtoId), It.IsAny<CancellationToken>()), Times.Once);
        _movimentacoes.Verify(r => r.ListarPorReferenciasAsync(TipoMovimentacao.SaidaProducao,
            It.Is<IReadOnlyCollection<Guid>>(ids => ids.Single() == producao.Id), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeveTratarFiltroDeProdutoVazioComoSemFiltro()
    {
        Cenario([], []);

        await _handler.Handle(new InsumosProducaoQuery(Ontem, Hoje, ProdutoIds: []), CancellationToken.None);

        _producoes.Verify(r => r.ListarAsync(Ontem, Hoje, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeveFiltrarPorIngrediente_EOrdenarPorDataProdutoEIngrediente()
    {
        var deOntem = ProducaoEm(Ontem);
        var deHoje = ProducaoEm(Hoje);
        Cenario([deHoje, deOntem],
        [
            SaidaDe(_farinha, deHoje, 1m),
            SaidaDe(_acucar, deHoje, 5m),
            SaidaDe(_farinha, deOntem, 3m),
        ]);

        var resultado = await _handler.Handle(
            new InsumosProducaoQuery(Ontem, Hoje, IngredienteIds: [_farinha.Id]), CancellationToken.None);

        resultado.Select(r => (r.Data, r.IngredienteNome, r.Quantidade)).Should().Equal(
            (DateOnly.FromDateTime(Ontem), "Farinha", 3m),
            (DateOnly.FromDateTime(Hoje), "Farinha", 1m));
    }
}
