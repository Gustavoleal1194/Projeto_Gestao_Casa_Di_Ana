using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Dtos;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class RegistrarEntradaValidatorBoletoTests
{
    private readonly RegistrarEntradaCommandValidator _sut = new();

    private static RegistrarEntradaCommand ComandoValido(
        bool temBoleto = false,
        DateTime? dataVencimentoBoleto = null) =>
        new(
            FornecedorId: Guid.NewGuid(),
            DataEntrada: DateTime.UtcNow,
            Itens: new List<ItemEntradaInputDto>
            {
                new(Guid.NewGuid(), 1m, 10m)
            }.AsReadOnly(),
            RecebidoPor: "João",
            TemBoleto: temBoleto,
            DataVencimentoBoleto: dataVencimentoBoleto);

    [Fact]
    public void Deve_passar_quando_TemBoleto_false_sem_data()
    {
        var result = _sut.Validate(ComandoValido(temBoleto: false));
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_TemBoleto_true_sem_data_vencimento()
    {
        var result = _sut.Validate(ComandoValido(temBoleto: true, dataVencimentoBoleto: null));
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DataVencimentoBoleto");
    }

    [Fact]
    public void Deve_falhar_quando_data_vencimento_no_passado()
    {
        var result = _sut.Validate(ComandoValido(
            temBoleto: true,
            dataVencimentoBoleto: DateTime.UtcNow.AddDays(-1)));
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DataVencimentoBoleto");
    }

    [Fact]
    public void Deve_passar_quando_TemBoleto_true_com_data_futura()
    {
        var result = _sut.Validate(ComandoValido(
            temBoleto: true,
            dataVencimentoBoleto: DateTime.UtcNow.AddDays(10)));
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_TemBoleto_true_com_data_hoje()
    {
        var result = _sut.Validate(ComandoValido(
            temBoleto: true,
            dataVencimentoBoleto: DateTime.UtcNow.Date));
        result.IsValid.Should().BeTrue();
    }
}
