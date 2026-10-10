using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;
using EntidadeImportacao = CasaDiAna.Domain.Entities.ImportacaoVendas;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ImportacaoVendasTests
{
    private static EntidadeImportacao Criar(decimal taxa, decimal entregas, ConfiguracaoRepasse? config = null) =>
        EntidadeImportacao.Criar(
            "vendas.csv", "hash", null, null,
            totalLinhas: 3, totalImportadas: 1, totalIgnoradas: 0, totalNaoEncontradas: 0,
            dataVenda: new DateTime(2026, 6, 10),
            totalTaxaServico: taxa, totalEntregas: entregas,
            configuracaoRepasse: config ?? ConfiguracaoRepasse.Padrao(Guid.NewGuid()),
            criadoPor: Guid.NewGuid());

    [Fact]
    public void Criar_DeveGravarTotaisDataESnapshotDosPercentuais()
    {
        var imp = Criar(1000m, 500m);

        imp.DataVenda.Should().Be(new DateTime(2026, 6, 10));
        imp.TotalTaxaServico.Should().Be(1000m);
        imp.TotalEntregas.Should().Be(500m);
        imp.PercentualRetencaoCasa.Should().Be(0.25m);
        imp.PercentualTaxaCartao.Should().Be(0.03m);
    }

    [Fact]
    public void RepasseEquipe_DeveSer72PorCentoDaTaxa_ComPercentuaisPadrao()
    {
        Criar(1000m, 0m).RepasseEquipe.Should().Be(720m);
    }

    [Fact]
    public void RepasseEquipe_DeveArredondarEmDuasCasas()
    {
        // 9,99 × 0,72 = 7,1928 → 7,19
        Criar(9.99m, 0m).RepasseEquipe.Should().Be(7.19m);
    }

    [Fact]
    public void RepasseMotoboys_DeveSerOTotalDeEntregas()
    {
        Criar(0m, 500m).RepasseMotoboys.Should().Be(500m);
    }

    [Fact]
    public void Snapshot_NaoMudaQuandoConfiguracaoMudaDepois()
    {
        var config = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        var imp = Criar(1000m, 0m, config);

        config.Atualizar(0.10m, 0.05m, Guid.NewGuid());

        imp.RepasseEquipe.Should().Be(720m);
    }

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(0, -1)]
    public void Criar_DeveRejeitarTotaisNegativos(double taxa, double entregas)
    {
        var act = () => Criar((decimal)taxa, (decimal)entregas);

        act.Should().Throw<DomainException>();
    }
}
