using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Dtos;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class RegistrarEntradaValidatorBoletoTests
{
    private readonly RegistrarEntradaCommandValidator _sut = new();

    private static RegistrarEntradaCommand ComandoValido(
        IReadOnlyList<DateTime>? datasVencimentoBoleto = null) =>
        new(
            FornecedorId: Guid.NewGuid(),
            DataEntrada: DateTime.UtcNow,
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
            datasVencimentoBoleto: new List<DateTime> { DateTime.UtcNow.AddDays(-1) }));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("hoje ou no futuro"));
    }

    [Fact]
    public void Deve_passar_quando_UmaDataFutura()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime> { DateTime.UtcNow.AddDays(10) }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_DataDeHoje()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime> { DateTime.UtcNow.Date }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_MultiplasDatasFuturas()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime>
            {
                DateTime.UtcNow.AddDays(10),
                DateTime.UtcNow.AddDays(40),
            }));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_UmaDeVariasDatasNoPassado()
    {
        var result = _sut.Validate(ComandoValido(
            datasVencimentoBoleto: new List<DateTime>
            {
                DateTime.UtcNow.AddDays(10),
                DateTime.UtcNow.AddDays(-2),
            }));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("hoje ou no futuro"));
    }

    [Fact]
    public void Deve_passar_quando_SoUtensilio_eItensEhNull()
    {
        var comando = new RegistrarEntradaCommand(
            FornecedorId: Guid.NewGuid(),
            DataEntrada: DateTime.UtcNow,
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
            DataEntrada: DateTime.UtcNow,
            Itens: null!,
            RecebidoPor: "João");

        var result = _sut.Validate(comando);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("pelo menos um item"));
    }
}
