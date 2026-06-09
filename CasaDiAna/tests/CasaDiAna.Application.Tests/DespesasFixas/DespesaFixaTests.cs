using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.DespesasFixas;

public class DespesaFixaTests
{
    [Fact]
    public void Criar_DeveNormalizarCompetenciaParaPrimeiroDiaDoMes()
    {
        var d = DespesaFixa.Criar(
            competencia: new DateTime(2026, 6, 17),
            categoria: CategoriaDespesaFixa.Aluguel,
            descricao: "Aluguel loja",
            valor: 3500m,
            observacao: null,
            dataLancamento: new DateTime(2026, 6, 17),
            criadoPor: Guid.NewGuid());

        d.Competencia.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        d.Ativo.Should().BeTrue();
        d.Valor.Should().Be(3500m);
    }

    [Fact]
    public void Criar_DeveLancar_QuandoValorZeroOuNegativo()
    {
        var acao = () => DespesaFixa.Criar(
            new DateTime(2026, 6, 1), CategoriaDespesaFixa.Energia, null, 0m, null,
            DateTime.Today, Guid.NewGuid());

        acao.Should().Throw<DomainException>()
            .WithMessage("Valor da despesa deve ser maior que zero.");
    }

    [Fact]
    public void Cancelar_DeveMarcarInativo()
    {
        var d = DespesaFixa.Criar(new DateTime(2026, 6, 1), CategoriaDespesaFixa.Gas, null, 200m, null,
            DateTime.Today, Guid.NewGuid());

        d.Cancelar(Guid.NewGuid());

        d.Ativo.Should().BeFalse();
    }
}
