using CasaDiAna.Application.Entradas.Commands.EditarEntrada;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class EditarEntradaCommandValidatorTests
{
    private readonly EditarEntradaCommandValidator _sut = new();

    private static EditarEntradaCommand ComandoValido() => new(
        EntradaId: Guid.NewGuid(),
        FornecedorId: Guid.NewGuid(),
        DataEntrada: DateTime.UtcNow,
        RecebidoPor: "Ana",
        CustosItens: new[] { new CustoItemInputDto(Guid.NewGuid(), 10m) },
        CustosItensUtensilio: new[] { new CustoItemInputDto(Guid.NewGuid(), 0m) });

    [Fact]
    public void Deve_passar_quando_ComandoValido()
    {
        _sut.Validate(ComandoValido()).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_BoletoNoPassado_PoisRegraFicaNoDominio()
    {
        var comando = ComandoValido() with { DatasVencimentoBoleto = new[] { DateTime.UtcNow.AddDays(-30) } };

        _sut.Validate(comando).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_FornecedorVazio()
    {
        var resultado = _sut.Validate(ComandoValido() with { FornecedorId = Guid.Empty });

        resultado.Errors.Should().Contain(e => e.ErrorMessage == "Fornecedor é obrigatório.");
    }

    [Fact]
    public void Deve_falhar_quando_RecebidoPorVazio()
    {
        var resultado = _sut.Validate(ComandoValido() with { RecebidoPor = "" });

        resultado.Errors.Should().Contain(e => e.ErrorMessage == "Informe quem recebeu os produtos.");
    }

    [Fact]
    public void Deve_falhar_quando_NotaFiscalMaiorQue60()
    {
        var resultado = _sut.Validate(ComandoValido() with { NumeroNotaFiscal = new string('9', 61) });

        resultado.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Deve_falhar_quando_CustoNegativo()
    {
        var comando = ComandoValido() with { CustosItens = new[] { new CustoItemInputDto(Guid.NewGuid(), -0.01m) } };

        _sut.Validate(comando).Errors.Should()
            .Contain(e => e.ErrorMessage == "Custo unitário não pode ser negativo.");
    }

    [Fact]
    public void Deve_falhar_quando_ItemIdVazio()
    {
        var comando = ComandoValido() with { CustosItensUtensilio = new[] { new CustoItemInputDto(Guid.Empty, 1m) } };

        _sut.Validate(comando).Errors.Should().Contain(e => e.ErrorMessage == "Item é obrigatório.");
    }

    [Fact]
    public void Deve_falhar_quando_ItemRepetido()
    {
        var itemId = Guid.NewGuid();
        var comando = ComandoValido() with
        {
            CustosItens = new[] { new CustoItemInputDto(itemId, 1m), new CustoItemInputDto(itemId, 2m) }
        };

        _sut.Validate(comando).Errors.Should()
            .Contain(e => e.ErrorMessage == "Item repetido na lista de custos.");
    }
}
