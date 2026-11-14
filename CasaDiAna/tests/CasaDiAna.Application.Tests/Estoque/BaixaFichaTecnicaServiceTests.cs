using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Estoque;

public class BaixaFichaTecnicaServiceTests
{
    private readonly BaixaFichaTecnicaFixture _f = new();

    [Fact]
    public async Task BaixarAsync_BaixaCadaIngrediente_RegistraMovimentacaoEDevolveCusto()
    {
        var cafe = _f.Ingrediente("Café", estoque: 1000m, custoUnitario: 0.10m);
        var leite = _f.Ingrediente("Leite", estoque: 5000m, custoUnitario: 0.01m);
        var produto = _f.Produto("Cappuccino", TipoProduto.FeitoNaHora, (cafe, 15m), (leite, 120m));
        var referencia = Guid.NewGuid();

        var custo = await _f.Servico().BaixarAsync(
            produto, 2m, TipoMovimentacao.SaidaVenda, "VendaDiaria", referencia, CancellationToken.None);

        cafe.EstoqueAtual.Should().Be(970m);
        leite.EstoqueAtual.Should().Be(4760m);
        custo.Should().Be(2m * (15m * 0.10m + 120m * 0.01m));
        _f.MovimentacoesGravadas.Should().HaveCount(2).And.OnlyContain(m =>
            m.Tipo == TipoMovimentacao.SaidaVenda &&
            m.ReferenciaTipo == "VendaDiaria" &&
            m.ReferenciaId == referencia);
        _f.MovimentacoesGravadas.Single(m => m.IngredienteId == cafe.Id).SaldoApos.Should().Be(970m);
    }

    [Fact]
    public async Task BaixarAsync_IngredienteCompartilhado_AcumulaSaldoNaMesmaOperacao()
    {
        var leite = _f.Ingrediente("Leite", estoque: 1000m, custoUnitario: 0.01m);
        var latte = _f.Produto("Latte", TipoProduto.FeitoNaHora, (leite, 200m));
        var cappuccino = _f.Produto("Cappuccino", TipoProduto.FeitoNaHora, (leite, 100m));
        var servico = _f.Servico();

        await servico.BaixarAsync(latte, 1m, TipoMovimentacao.SaidaVenda, "VendaDiaria", Guid.NewGuid(), default);
        await servico.BaixarAsync(cappuccino, 1m, TipoMovimentacao.SaidaVenda, "VendaDiaria", Guid.NewGuid(), default);

        leite.EstoqueAtual.Should().Be(700m);
        _f.Ingredientes.Verify(r => r.ObterPorIdAsync(leite.Id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task BaixarVendaAsync_FeitoNaHoraComFicha_BaixaERegistraCustoNaVenda()
    {
        var pao = _f.Ingrediente("Pão", estoque: 10m, custoUnitario: 1.5m);
        var produto = _f.Produto("Sanduíche", TipoProduto.FeitoNaHora, (pao, 1m));
        var venda = VendaDiaria.Criar(produto.Id, DateTime.Today, 3m, _f.UsuarioId);

        var baixou = await _f.Servico().BaixarVendaAsync(produto, venda, default);

        baixou.Should().BeTrue();
        pao.EstoqueAtual.Should().Be(7m);
        venda.CustoTotal.Should().Be(4.5m);
    }

    [Theory]
    [InlineData(TipoProduto.Produzido)]
    [InlineData(TipoProduto.Revenda)]
    public async Task BaixarVendaAsync_ProdutoQueNaoBaixaNaVenda_NaoMexeNoEstoque(TipoProduto tipo)
    {
        var farinha = _f.Ingrediente("Farinha", estoque: 10m, custoUnitario: 1m);
        var produto = tipo == TipoProduto.Revenda
            ? _f.Produto("Refrigerante", tipo)
            : _f.Produto("Bolo", tipo, (farinha, 1m));
        var venda = VendaDiaria.Criar(produto.Id, DateTime.Today, 1m, _f.UsuarioId);

        var baixou = await _f.Servico().BaixarVendaAsync(produto, venda, default);

        baixou.Should().BeFalse();
        farinha.EstoqueAtual.Should().Be(10m);
        venda.CustoTotal.Should().BeNull();
        _f.MovimentacoesGravadas.Should().BeEmpty();
    }

    [Fact]
    public async Task BaixarVendaAsync_FeitoNaHoraSemFicha_NaoBaixa()
    {
        var produto = _f.Produto("Suco", TipoProduto.FeitoNaHora);
        var venda = VendaDiaria.Criar(produto.Id, DateTime.Today, 1m, _f.UsuarioId);

        var baixou = await _f.Servico().BaixarVendaAsync(produto, venda, default);

        baixou.Should().BeFalse();
        venda.CustoTotal.Should().BeNull();
    }

    [Fact]
    public async Task NotificarEstoqueBaixoAsync_VerificaCadaIngredienteBaixadoUmaVez()
    {
        var cafe = _f.Ingrediente("Café", estoque: 100m, custoUnitario: 0.1m);
        var produto = _f.Produto("Espresso", TipoProduto.FeitoNaHora, (cafe, 10m));
        var servico = _f.Servico();
        await servico.BaixarAsync(produto, 1m, TipoMovimentacao.SaidaVenda, "VendaDiaria", Guid.NewGuid(), default);
        await servico.BaixarAsync(produto, 1m, TipoMovimentacao.SaidaVenda, "VendaDiaria", Guid.NewGuid(), default);

        await servico.NotificarEstoqueBaixoAsync(default);

        _f.Notificacoes.Verify(n => n.VerificarECriarAsync(cafe, It.IsAny<CancellationToken>()), Times.Once);
    }
}
