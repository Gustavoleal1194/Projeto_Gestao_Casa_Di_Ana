using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ConfirmarImportacaoCommandValidatorTests
{
    private readonly ConfirmarImportacaoCommandValidator _validator = new();

    private static ConfirmarImportacaoCommand Command(
        byte[]? csv = null, string nome = "vendas.csv", DateTime? data = null,
        IReadOnlyList<VinculoLinhaDto>? vinculos = null,
        IReadOnlyList<string>? removidas = null) =>
        new(csv ?? [1], nome, data ?? DateTime.Today, vinculos ?? [], removidas ?? []);

    [Fact]
    public void ComandoMinimo_Valido() =>
        _validator.Validate(Command()).IsValid.Should().BeTrue();

    [Fact]
    public void CsvVazio_Invalido() =>
        _validator.Validate(Command(csv: [])).IsValid.Should().BeFalse();

    [Fact]
    public void NomeArquivoVazio_Invalido() =>
        _validator.Validate(Command(nome: "")).IsValid.Should().BeFalse();

    [Fact]
    public void DataFutura_Invalido() =>
        _validator.Validate(Command(data: DateTime.Today.AddDays(3))).IsValid.Should().BeFalse();

    [Fact]
    public void VinculoSemNome_Invalido() =>
        _validator.Validate(Command(vinculos: [new VinculoLinhaDto("", Guid.NewGuid())])).IsValid.Should().BeFalse();

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void LinhaRemovidaSemNome_Invalido(string? nome) =>
        _validator.Validate(Command(removidas: [nome!])).IsValid.Should().BeFalse();

    [Fact]
    public void VinculoSemProduto_Invalido() =>
        _validator.Validate(Command(vinculos: [new VinculoLinhaDto("Croissant", Guid.Empty)])).IsValid.Should().BeFalse();
}
