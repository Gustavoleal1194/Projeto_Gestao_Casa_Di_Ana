using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class EntradaMercadoriaBoletoTests
{
    [Fact]
    public void TemBoleto_DeveSerFalso_QuandoNenhumBoletoAdicionado()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());

        entrada.TemBoleto.Should().BeFalse();
        entrada.ProximoVencimentoBoleto.Should().BeNull();
        entrada.Boletos.Should().BeEmpty();
    }

    [Fact]
    public void AdicionarBoleto_DeveAdicionarUmBoleto()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var vencimento = DateTime.UtcNow.Date.AddDays(10);

        entrada.AdicionarBoleto(vencimento);

        entrada.TemBoleto.Should().BeTrue();
        entrada.Boletos.Should().HaveCount(1);
        entrada.Boletos.First().DataVencimento.Should().Be(vencimento);
        entrada.ProximoVencimentoBoleto.Should().Be(vencimento);
    }

    [Fact]
    public void AdicionarBoleto_DeveAceitarMultiplosBoletos()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var vencimento1 = DateTime.UtcNow.Date.AddDays(10);
        var vencimento2 = DateTime.UtcNow.Date.AddDays(40);

        entrada.AdicionarBoleto(vencimento1);
        entrada.AdicionarBoleto(vencimento2);

        entrada.Boletos.Should().HaveCount(2);
    }

    [Fact]
    public void ProximoVencimentoBoleto_DeveRetornarOMenorEntreMultiplosBoletos()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var vencimentoDistante = DateTime.UtcNow.Date.AddDays(40);
        var vencimentoProximo = DateTime.UtcNow.Date.AddDays(10);

        entrada.AdicionarBoleto(vencimentoDistante);
        entrada.AdicionarBoleto(vencimentoProximo);

        entrada.ProximoVencimentoBoleto.Should().Be(vencimentoProximo);
    }

    [Fact]
    public void AdicionarBoleto_DeveLancarExcecao_QuandoEntradaCancelada()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        entrada.Cancelar(Guid.NewGuid());

        var acao = () => entrada.AdicionarBoleto(DateTime.UtcNow.Date.AddDays(5));

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }
}
