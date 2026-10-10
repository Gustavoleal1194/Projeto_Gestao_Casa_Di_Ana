using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using EntidadeImportacao = CasaDiAna.Domain.Entities.ImportacaoVendas;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ConfirmarImportacaoCommandHandlerTests
{
    private readonly Mock<IVendaDiariaRepository> _vendas = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<IImportacaoVendasRepository> _importacoes = new();
    private readonly Mock<IConfiguracaoRepasseRepository> _configRepasse = new();
    private readonly Mock<ICurrentUserService> _user = new();
    private EntidadeImportacao? _gravada;

    public ConfirmarImportacaoCommandHandlerTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _importacoes.Setup(r => r.HashExisteAsync(It.IsAny<string>(), default)).ReturnsAsync(false);
        _importacoes.Setup(r => r.AdicionarAsync(It.IsAny<EntidadeImportacao>(), default))
                    .Callback<EntidadeImportacao, CancellationToken>((i, _) => _gravada = i)
                    .Returns(Task.CompletedTask);
        _vendas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(new List<Produto>());
    }

    private ConfirmarImportacaoCommandHandler Criar() =>
        new(_vendas.Object, _produtos.Object, _importacoes.Object, _configRepasse.Object, _user.Object);

    private static ConfirmarImportacaoCommand Command(
        IReadOnlyList<ItemConfirmarDto> itens, decimal taxa, decimal entregas) =>
        new("hash", "vendas.csv", new DateTime(2026, 6, 10), null, null,
            TotalLinhasParseadas: 3, TotalIgnoradas: 0, TotalNaoEncontradas: 0,
            Itens: itens, TotalTaxaServico: taxa, TotalEntregas: entregas);

    [Fact]
    public async Task DeveGravarTotaisDataESnapshotDaConfiguracaoVigente()
    {
        var config = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        config.Atualizar(0.20m, 0.05m, Guid.NewGuid());
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync(config);

        var resultado = await Criar().Handle(Command([], 1000m, 500m), CancellationToken.None);

        _gravada!.DataVenda.Should().Be(new DateTime(2026, 6, 10));
        _gravada.TotalTaxaServico.Should().Be(1000m);
        _gravada.TotalEntregas.Should().Be(500m);
        _gravada.PercentualRetencaoCasa.Should().Be(0.20m);
        _gravada.PercentualTaxaCartao.Should().Be(0.05m);
        resultado.TotalTaxaServico.Should().Be(1000m);
        resultado.TotalEntregas.Should().Be(500m);
    }

    [Fact]
    public async Task DeveUsarPercentuaisPadrao_QuandoNaoHaConfiguracao()
    {
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);

        await Criar().Handle(Command([], 1000m, 0m), CancellationToken.None);

        _gravada!.PercentualRetencaoCasa.Should().Be(0.25m);
        _gravada.PercentualTaxaCartao.Should().Be(0.03m);
        _configRepasse.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoRepasse>(), default), Times.Never);
    }

    [Fact]
    public async Task ImportacaoSoDeRepasses_NaoCriaVendas()
    {
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);

        var resultado = await Criar().Handle(Command([], 90m, 0m), CancellationToken.None);

        resultado.TotalImportadas.Should().Be(0);
        _gravada.Should().NotBeNull();
        _vendas.Verify(r => r.AdicionarRangeAsync(
            It.Is<IEnumerable<VendaDiaria>>(v => !v.Any()), default), Times.Once);
    }
}
