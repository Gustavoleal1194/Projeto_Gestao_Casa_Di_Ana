using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class ConfiguracaoRepasseTests
{
    [Fact]
    public void Padrao_DeveTer25PorCentoDeRetencaoE3PorCentoDeCartao()
    {
        var c = ConfiguracaoRepasse.Padrao(Guid.NewGuid());

        c.PercentualRetencaoCasa.Should().Be(0.25m);
        c.PercentualTaxaCartao.Should().Be(0.03m);
    }

    [Fact]
    public void Atualizar_DeveAlterarPercentuais()
    {
        var c = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        var usuario = Guid.NewGuid();

        c.Atualizar(0.20m, 0.04m, usuario);

        c.PercentualRetencaoCasa.Should().Be(0.20m);
        c.PercentualTaxaCartao.Should().Be(0.04m);
        c.AtualizadoPor.Should().Be(usuario);
    }

    [Theory]
    [InlineData(-0.01, 0.03)]  // retenção negativa
    [InlineData(1, 0)]         // retenção = 100%
    [InlineData(0.25, -0.01)]  // cartão negativo
    [InlineData(0.25, 1)]      // cartão = 100%
    [InlineData(0.6, 0.4)]     // soma = 100%
    [InlineData(0.7, 0.5)]     // soma > 100%
    public void Atualizar_DeveRejeitarPercentuaisInvalidos(double retencao, double cartao)
    {
        var c = ConfiguracaoRepasse.Padrao(Guid.NewGuid());

        var act = () => c.Atualizar((decimal)retencao, (decimal)cartao, Guid.NewGuid());

        act.Should().Throw<DomainException>();
    }
}
