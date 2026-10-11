using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class LeitorRelatorioVendasTests
{
    private readonly Mock<IVendasParser> _parser = new();

    private LeitorRelatorioVendas Criar() => new(_parser.Object);

    [Fact]
    public void Ler_DeveRepassarHashPeriodoEClassificarRepasses()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult("01/06/2026", "30/06/2026", "hash1", new List<LinhaRelatorio>
               {
                   new("001", "Croissant", null, 10m, 100m),
                   new("77", "TAXA DE SERVIÇO", null, 1m, 90m),
                   new("50", "Entrega longe", null, 2m, 20m),
               }));

        var relatorio = Criar().Ler([1, 2, 3]);

        relatorio.Hash.Should().Be("hash1");
        relatorio.PeriodoDe.Should().Be("01/06/2026");
        relatorio.PeriodoAte.Should().Be("30/06/2026");
        relatorio.Linhas.Select(l => l.TipoRepasse).Should().Equal(
            null, TipoRepasse.TaxaServico, TipoRepasse.Entrega);
        relatorio.Linhas[0].Linha.Nome.Should().Be("Croissant");
    }

    [Fact]
    public void Ler_SemLinhas_LancaDomainException()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "h", new List<LinhaRelatorio>()));

        var act = () => Criar().Ler([1]);

        act.Should().Throw<DomainException>().WithMessage("Nenhuma linha*");
    }

    [Fact]
    public void Ler_ParserFalha_LancaDomainExceptionComMotivo()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>())).Throws(new FormatException("coluna ausente"));

        var act = () => Criar().Ler([1]);

        act.Should().Throw<DomainException>()
           .WithMessage("Falha ao processar o arquivo CSV: coluna ausente");
    }
}
