using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using EntidadeImportacao = CasaDiAna.Domain.Entities.ImportacaoVendas;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ConfirmarImportacaoCommandHandlerTests
{
    private static readonly DateTime DataVenda = new(2026, 6, 10);

    private readonly Mock<IVendasParser> _parser = new();
    private readonly Mock<IVendaDiariaRepository> _vendas = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<IImportacaoVendasRepository> _importacoes = new();
    private readonly Mock<IConfiguracaoRepasseRepository> _configRepasse = new();
    private readonly Mock<ICurrentUserService> _user = new();
    private readonly List<Produto> _catalogo = new();
    private EntidadeImportacao? _gravada;
    private List<VendaDiaria> _vendasGravadas = new();

    private readonly Produto _croissant;
    private readonly Produto _bolo;

    public ConfirmarImportacaoCommandHandlerTests()
    {
        _croissant = CriarProduto("Croissant");
        _bolo = CriarProduto("Bolo de cenoura");
        _catalogo.AddRange([_croissant, _bolo]);

        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _importacoes.Setup(r => r.HashExisteAsync(It.IsAny<string>(), default)).ReturnsAsync(false);
        _importacoes.Setup(r => r.AdicionarAsync(It.IsAny<EntidadeImportacao>(), default))
                    .Callback<EntidadeImportacao, CancellationToken>((i, _) => _gravada = i)
                    .Returns(Task.CompletedTask);
        _vendas.Setup(r => r.AdicionarRangeAsync(It.IsAny<IEnumerable<VendaDiaria>>(), default))
               .Callback<IEnumerable<VendaDiaria>, CancellationToken>((v, _) => _vendasGravadas = v.ToList())
               .Returns(Task.CompletedTask);
        _vendas.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(_catalogo);
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);

        CsvCom(
            new("001", "Croissant", null, 10m, 100m),
            new("002", "Bolo Cenoura", null, 3m, 60m),
            new("77", "TAXA DE SERVIÇO", null, 1m, 90m),
            new("50", "Entrega longe", null, 2m, 20m));
    }

    private void CsvCom(params LinhaRelatorio[] linhas) =>
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult("01/06/2026", "30/06/2026", "hash-real", linhas.ToList()));

    private ConfirmarImportacaoCommandHandler Criar() =>
        new(new LeitorRelatorioVendas(_parser.Object), _vendas.Object, _produtos.Object,
            _importacoes.Object, _configRepasse.Object, _user.Object);

    private static ConfirmarImportacaoCommand Command(
        IReadOnlyList<VinculoLinhaDto>? vinculos = null,
        IReadOnlyList<string>? removidas = null) =>
        new([1, 2, 3], "vendas.csv", DataVenda, vinculos ?? [], removidas ?? []);

    private VinculoLinhaDto Vinculo(string nome, Produto produto) => new(nome, produto.Id);

    [Fact]
    public async Task DeveUsarQuantidadesETotaisDoCsv()
    {
        var resultado = await Criar().Handle(
            Command([Vinculo("Croissant", _croissant)]), CancellationToken.None);

        _vendasGravadas.Should().ContainSingle();
        _vendasGravadas[0].ProdutoId.Should().Be(_croissant.Id);
        _vendasGravadas[0].QuantidadeVendida.Should().Be(10m);
        _gravada!.HashConteudo.Should().Be("hash-real");
        _gravada.DataVenda.Should().Be(DataVenda);
        _gravada.PeriodoDe.Should().Be("01/06/2026");
        _gravada.TotalTaxaServico.Should().Be(90m);
        _gravada.TotalEntregas.Should().Be(20m);
        _gravada.TotalLinhasParseadas.Should().Be(4);
        _gravada.TotalImportadas.Should().Be(1);
        _gravada.TotalNaoEncontradas.Should().Be(1); // "Bolo Cenoura" sem vínculo
        resultado.TotalTaxaServico.Should().Be(90m);
        resultado.TotalEntregas.Should().Be(20m);
    }

    [Fact]
    public async Task VinculoParaLinhaQueOServidorNaoCasaria_GeraVendaDoProdutoVinculado()
    {
        await Criar().Handle(
            Command([Vinculo("Bolo Cenoura", _bolo)]), CancellationToken.None);

        _vendasGravadas.Should().ContainSingle(v => v.ProdutoId == _bolo.Id && v.QuantidadeVendida == 3m);
    }

    [Fact]
    public async Task LinhasRemovidas_FicamForaDasVendasEDosTotais()
    {
        await Criar().Handle(
            Command([Vinculo("Croissant", _croissant)], ["Entrega longe", "Bolo Cenoura"]),
            CancellationToken.None);

        _gravada!.TotalEntregas.Should().Be(0m);
        _gravada.TotalTaxaServico.Should().Be(90m);
        _gravada.TotalIgnoradas.Should().Be(2);
        _gravada.TotalNaoEncontradas.Should().Be(0);
    }

    [Fact]
    public async Task NomeRepetidoNoCsv_RecebeAMesmaDecisao()
    {
        CsvCom(
            new("001", "Croissant", null, 10m, 100m),
            new("001", "Croissant", null, 4m, 40m));

        await Criar().Handle(Command([Vinculo("Croissant", _croissant)]), CancellationToken.None);

        _vendasGravadas.Select(v => v.QuantidadeVendida).Should().BeEquivalentTo([10m, 4m]);
    }

    [Fact]
    public async Task CsvJaImportado_LancaDomainException()
    {
        _importacoes.Setup(r => r.HashExisteAsync("hash-real", default)).ReturnsAsync(true);

        var act = () => Criar().Handle(Command([Vinculo("Croissant", _croissant)]), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
                 .WithMessage("Este arquivo já foi importado anteriormente.");
    }

    [Fact]
    public async Task CsvSoComRepasses_ImportaSemVendas()
    {
        CsvCom(new LinhaRelatorio("77", "TAXA DE SERVIÇO", null, 1m, 90m));

        var resultado = await Criar().Handle(Command(), CancellationToken.None);

        resultado.TotalImportadas.Should().Be(0);
        _gravada!.TotalTaxaServico.Should().Be(90m);
    }

    [Fact]
    public async Task TudoRemovido_LancaDomainException()
    {
        CsvCom(new LinhaRelatorio("77", "TAXA DE SERVIÇO", null, 1m, 90m));

        var act = () => Criar().Handle(Command(removidas: ["TAXA DE SERVIÇO"]), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
                 .WithMessage("Nenhum item ou repasse confirmado para importação.");
    }

    [Fact]
    public async Task DeveUsarSnapshotDaConfiguracaoVigente()
    {
        var config = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        config.Atualizar(0.20m, 0.05m, Guid.NewGuid());
        _configRepasse.Setup(r => r.ObterAsync(default)).ReturnsAsync(config);

        await Criar().Handle(Command(), CancellationToken.None);

        _gravada!.PercentualRetencaoCasa.Should().Be(0.20m);
        _gravada.PercentualTaxaCartao.Should().Be(0.05m);
        _configRepasse.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoRepasse>(), default), Times.Never);
    }

    [Fact]
    public async Task DecisoesInvalidas_LancamDomainExceptionComTodosOsMotivos()
    {
        var inativo = CriarProduto("Antigo", ativo: false);
        _catalogo.Add(inativo);

        var act = () => Criar().Handle(Command(
            vinculos:
            [
                new("Não existe no CSV", _croissant.Id),
                new("TAXA DE SERVIÇO", _croissant.Id),
                new("Croissant", inativo.Id),
                new("Bolo Cenoura", Guid.NewGuid()),
            ],
            removidas: ["Croissant", "Também não existe"]), CancellationToken.None);

        var ex = (await act.Should().ThrowAsync<DomainException>()).Which;
        ex.Message.Should().Contain("Não existe no CSV")
            .And.Contain("Também não existe")
            .And.Contain("TAXA DE SERVIÇO")
            .And.Contain("Antigo")
            .And.Contain("vinculada e removida");
        _importacoes.Verify(r => r.AdicionarAsync(It.IsAny<EntidadeImportacao>(), default), Times.Never);
    }

    private static Produto CriarProduto(string nome, bool ativo = true)
    {
        var produto = (Produto)System.Runtime.CompilerServices.RuntimeHelpers
            .GetUninitializedObject(typeof(Produto));
        typeof(Produto).GetProperty(nameof(Produto.Id))!.SetValue(produto, Guid.NewGuid());
        typeof(Produto).GetProperty(nameof(Produto.Nome))!.SetValue(produto, nome);
        typeof(Produto).GetProperty(nameof(Produto.Ativo))!.SetValue(produto, ativo);
        return produto;
    }
}
