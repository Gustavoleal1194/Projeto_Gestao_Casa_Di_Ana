using CasaDiAna.Domain.Common;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Common;

public class FusoHorarioLojaTests
{
    [Fact]
    public void Hoje_aNoite_RetornaODiaDeBrasilia_NaoODiaUtc() =>
        RelogioFixo.ANoite().Hoje().Should().Be(new DateTime(2026, 11, 30));

    [Fact]
    public void PeriodoEmUtc_CobreOsDiasInteirosNoHorarioDeBrasilia()
    {
        var (inicio, fim) = FusoHorarioLoja.PeriodoEmUtc(new DateTime(2026, 11, 1), new DateTime(2026, 11, 30));

        inicio.Should().Be(new DateTime(2026, 11, 1, 3, 0, 0, DateTimeKind.Utc));
        fim.Should().Be(new DateTime(2026, 12, 1, 3, 0, 0, DateTimeKind.Utc));
        inicio.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void PeriodoEmUtc_IncluiMovimentacaoFeitaAs22hDoUltimoDia()
    {
        var (inicio, fim) = FusoHorarioLoja.PeriodoEmUtc(new DateTime(2026, 11, 30), new DateTime(2026, 11, 30));
        var as22hEmBrasilia = RelogioFixo.NoiteEmBrasilia.UtcDateTime;

        as22hEmBrasilia.Should().BeOnOrAfter(inicio).And.BeBefore(fim);
    }
}
