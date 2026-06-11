using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Precificacao;

public class ConfiguracaoPrecificacaoTests
{
    [Fact]
    public void Padrao_DeveUsarDefaults_30_20_0()
    {
        var c = ConfiguracaoPrecificacao.Padrao(Guid.NewGuid());
        c.CmvAlvo.Should().Be(0.30m);
        c.MargemDesejada.Should().Be(0.20m);
        c.Taxas.Should().Be(0m);
    }

    [Fact]
    public void Atualizar_DeveAlterarFracoes()
    {
        var c = ConfiguracaoPrecificacao.Padrao(Guid.NewGuid());
        c.Atualizar(0.35m, 0.25m, 0.05m, Guid.NewGuid());
        c.CmvAlvo.Should().Be(0.35m);
        c.MargemDesejada.Should().Be(0.25m);
        c.Taxas.Should().Be(0.05m);
    }

    [Theory]
    [InlineData(0, 0.2, 0.0)]      // cmvAlvo deve ser > 0
    [InlineData(1, 0.2, 0.0)]      // cmvAlvo deve ser < 1
    [InlineData(0.3, 1, 0.0)]      // margem deve ser < 1
    [InlineData(0.3, -0.1, 0.0)]   // margem deve ser >= 0
    [InlineData(0.3, 0.2, 1)]      // taxas deve ser < 1
    public void Atualizar_DeveLancar_QuandoForaDoIntervalo(double cmv, double margem, double taxas)
    {
        var c = ConfiguracaoPrecificacao.Padrao(Guid.NewGuid());
        var acao = () => c.Atualizar((decimal)cmv, (decimal)margem, (decimal)taxas, Guid.NewGuid());
        acao.Should().Throw<DomainException>();
    }
}
