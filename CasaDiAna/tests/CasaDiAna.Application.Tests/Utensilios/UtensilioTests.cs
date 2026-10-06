using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Utensilios;

public class UtensilioTests
{
    [Fact]
    public void Criar_DeveDefinirCampos()
    {
        var criadoPor = Guid.NewGuid();
        var u = Utensilio.Criar("Detergente Neutro", unidadeMedidaId: 1, estoqueMinimo: 2m, criadoPor: criadoPor, codigoInterno: "DET-001");

        u.Nome.Should().Be("Detergente Neutro");
        u.CodigoInterno.Should().Be("DET-001");
        u.EstoqueMinimo.Should().Be(2m);
        u.EstoqueAtual.Should().Be(0m);
        u.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Criar_DeveLancarExcecao_QuandoEstoqueMinimoNegativo()
    {
        var acao = () => Utensilio.Criar("Detergente", 1, -1m, Guid.NewGuid());

        acao.Should().Throw<DomainException>().WithMessage("*negativo*");
    }

    [Fact]
    public void Criar_DeveLancarExcecao_QuandoEstoqueMaximoMenorQueMinimo()
    {
        var acao = () => Utensilio.Criar("Detergente", 1, 10m, Guid.NewGuid(), estoqueMaximo: 5m);

        acao.Should().Throw<DomainException>().WithMessage("*mínimo*");
    }

    [Fact]
    public void AtualizarEstoque_DeveClamparEmZero_QuandoSaldoNegativo()
    {
        var u = Utensilio.Criar("Detergente", 1, 0m, Guid.NewGuid());
        u.AtualizarEstoque(-5m, Guid.NewGuid());

        u.EstoqueAtual.Should().Be(0m);
    }

    [Fact]
    public void AtualizarEstoque_DeveSomarQuantidade()
    {
        var u = Utensilio.Criar("Detergente", 1, 0m, Guid.NewGuid());
        u.AtualizarEstoque(10m, Guid.NewGuid());

        u.EstoqueAtual.Should().Be(10m);
    }

    [Fact]
    public void EstaBaixoDoMinimo_DeveRetornarTrue_QuandoEstoqueMenorQueMinimo()
    {
        var u = Utensilio.Criar("Detergente", 1, 10m, Guid.NewGuid());
        u.AtualizarEstoque(5m, Guid.NewGuid());

        u.EstaBaixoDoMinimo().Should().BeTrue();
    }

    [Fact]
    public void AtualizarCusto_DeveLancarExcecao_QuandoNegativo()
    {
        var u = Utensilio.Criar("Detergente", 1, 0m, Guid.NewGuid());
        var acao = () => u.AtualizarCusto(-1m, Guid.NewGuid());

        acao.Should().Throw<DomainException>().WithMessage("*negativo*");
    }

    [Fact]
    public void Desativar_DeveMarcarInativo()
    {
        var u = Utensilio.Criar("Detergente", 1, 0m, Guid.NewGuid());
        u.Desativar(Guid.NewGuid());

        u.Ativo.Should().BeFalse();
    }
}
