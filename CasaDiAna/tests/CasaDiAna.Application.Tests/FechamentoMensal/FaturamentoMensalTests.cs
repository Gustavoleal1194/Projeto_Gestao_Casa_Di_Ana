using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class FaturamentoMensalTests
{
    [Fact]
    public void Criar_DeveNormalizarCompetencia()
    {
        var f = FaturamentoMensal.Criar(new DateTime(2026, 6, 20), 50000m, Guid.NewGuid());
        f.Competencia.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        f.ValorManual.Should().Be(50000m);
    }

    [Fact]
    public void DefinirValor_DevePermitirLimparComNull()
    {
        var f = FaturamentoMensal.Criar(new DateTime(2026, 6, 1), 50000m, Guid.NewGuid());
        f.DefinirValor(null, Guid.NewGuid());
        f.ValorManual.Should().BeNull();
    }

    [Fact]
    public void DefinirValor_DeveLancar_QuandoZeroOuNegativo()
    {
        var f = FaturamentoMensal.Criar(new DateTime(2026, 6, 1), null, Guid.NewGuid());
        var acao = () => f.DefinirValor(0m, Guid.NewGuid());
        acao.Should().Throw<DomainException>()
            .WithMessage("Faturamento manual deve ser maior que zero.");
    }
}
