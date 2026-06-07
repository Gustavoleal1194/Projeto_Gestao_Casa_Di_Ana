using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Produtos;

public class ProdutoTests
{
    private static Produto CriarRevenda() =>
        Produto.Criar("Coca-Cola Lata", 7m, Guid.NewGuid(), tipo: TipoProduto.Revenda);

    [Fact]
    public void Criar_DeveDefinirTipoProduzidoPorPadrao()
    {
        var p = Produto.Criar("Bolo", 20m, Guid.NewGuid());
        p.Tipo.Should().Be(TipoProduto.Produzido);
        p.CustoUnitario.Should().BeNull();
    }

    [Fact]
    public void Criar_Revenda_DeveIniciarSemCustoUnitario()
    {
        var p = CriarRevenda();
        p.Tipo.Should().Be(TipoProduto.Revenda);
        p.CustoUnitario.Should().BeNull();
        p.CalcularCustoFicha().Should().Be(0m);
    }

    [Fact]
    public void DefinirCustoUnitario_DeveDefinirCusto_QuandoRevenda()
    {
        var p = CriarRevenda();
        p.DefinirCustoUnitario(3.50m);
        p.CustoUnitario.Should().Be(3.50m);
        p.CalcularCustoFicha().Should().Be(3.50m);
        p.CalcularMargemLucro().Should().BeApproximately(50m, 0.01m);
    }

    [Fact]
    public void DefinirCustoUnitario_DeveLancar_QuandoProdutoProduzido()
    {
        var p = Produto.Criar("Bolo", 20m, Guid.NewGuid());
        var acao = () => p.DefinirCustoUnitario(3m);
        acao.Should().Throw<DomainException>();
    }

    [Fact]
    public void DefinirCustoUnitario_DeveLancar_QuandoValorNaoPositivo()
    {
        var p = CriarRevenda();
        var acao = () => p.DefinirCustoUnitario(0m);
        acao.Should().Throw<DomainException>();
    }

    [Fact]
    public void DefinirFichaTecnica_DeveLancar_QuandoRevenda()
    {
        var p = CriarRevenda();
        var acao = () => p.DefinirFichaTecnica(new[] { (Guid.NewGuid(), 1m) });
        acao.Should().Throw<DomainException>();
    }

    [Fact]
    public void Atualizar_ParaProduzido_DeveZerarCustoUnitario()
    {
        var p = CriarRevenda();
        p.DefinirCustoUnitario(3m);
        p.Atualizar("Coca-Cola Lata", 7m, Guid.NewGuid(), tipo: TipoProduto.Produzido);
        p.Tipo.Should().Be(TipoProduto.Produzido);
        p.CustoUnitario.Should().BeNull();
    }
}
