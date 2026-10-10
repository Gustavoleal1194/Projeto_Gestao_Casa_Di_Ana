using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ConfirmarImportacaoCommandValidatorTests
{
    private readonly ConfirmarImportacaoCommandValidator _validator = new();

    private static ConfirmarImportacaoCommand Command(
        IReadOnlyList<ItemConfirmarDto> itens, decimal taxa = 0m, decimal entregas = 0m) =>
        new("hash", "vendas.csv", DateTime.Today, null, null, 1, 0, 0, itens, taxa, entregas);

    [Fact]
    public void SemItensESemRepasse_Invalido() =>
        _validator.Validate(Command([])).IsValid.Should().BeFalse();

    [Fact]
    public void SemItensComTaxa_Valido() =>
        _validator.Validate(Command([], taxa: 10m)).IsValid.Should().BeTrue();

    [Fact]
    public void SemItensComEntregas_Valido() =>
        _validator.Validate(Command([], entregas: 10m)).IsValid.Should().BeTrue();

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(0, -1)]
    public void TotaisNegativos_Invalido(double taxa, double entregas) =>
        _validator.Validate(Command([new ItemConfirmarDto(Guid.NewGuid(), 1m)], (decimal)taxa, (decimal)entregas))
            .IsValid.Should().BeFalse();
}
