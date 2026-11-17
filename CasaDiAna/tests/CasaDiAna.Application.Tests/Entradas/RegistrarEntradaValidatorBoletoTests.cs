using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Application.Tests.Common;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class RegistrarEntradaValidatorBoletoTests
{
    private static readonly DateTime Hoje = RelogioFixo.HojeNaLoja;
    private readonly RegistrarEntradaCommandValidator _sut = new(RelogioFixo.ANoite());

    private static RegistrarEntradaCommand ComandoValido(
        IReadOnlyList<DateTime>? datasVencimentoBoleto = null) =>
        new(
            FornecedorId: Guid.NewGuid(),
            DataEntrada: Hoje,
            Itens: new List<ItemEntradaInputDto>
            {
                new(Guid.NewGuid(), 1m, 10m)
            }.AsReadOnly(),
            RecebidoPor: "João",
            DatasVencimentoBoleto: datasVencimentoBoleto);

    [Fact]
    public void Deve_passar_quando_SemBoleto()
    {
        var result = _sut.Validate(ComandoValido());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_DataDeBoletoNoPassado()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime> { Hoje.AddDays(-1) }));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("hoje ou no futuro"));
    }

    [Fact]
    public void Deve_passar_quando_UmaDataFutura()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime> { Hoje.AddDays(10) }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_DataDeHoje()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime> { Hoje }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_DataDeHoje_aNoite_JaAmanhaEmUtc()
    {
        // 22h30 em Brasília = 01h30 do dia seguinte em UTC: boleto vencendo hoje é válido
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime> { new(2026, 11, 30) }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_MultiplasDatasFuturas()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime>
            {
                Hoje.AddDays(10),
                Hoje.AddDays(40),
            }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_UmaDeVariasDatasNoPassado()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime>
            {
                Hoje.AddDays(10),
                Hoje.AddDays(-2),
            }));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("hoje ou no futuro"));
    }

    [Fact]
    public void Deve_passar_quando_SoUtensilio_eItensEhNull()
    {
        var comando = new RegistrarEntradaCommand(
            FornecedorId: Guid.NewGuid(),
            DataEntrada: Hoje,
            Itens: null!,
            RecebidoPor: "João",
            ItensUtensilio: new List<ItemEntradaUtensilioInputDto> { new(Guid.NewGuid(), 1m, 10m) }.AsReadOnly());

        var result = _sut.Validate(comando);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_ItensNuloEItensUtensilioVazio()
    {
        var comando = new RegistrarEntradaCommand(
            FornecedorId: Guid.NewGuid(),
            DataEntrada: Hoje,
            Itens: null!,
            RecebidoPor: "João");

        var result = _sut.Validate(comando);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("pelo menos um item"));
    }
}
