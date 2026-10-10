using CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.ImportacaoVendas;

public class ProcessarPreviewHandlerTests
{
    private readonly Mock<IVendasParser> _parser = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<IImportacaoVendasRepository> _importacoes = new();

    private ProcessarPreviewVendasCommandHandler CreateHandler() =>
        new(_parser.Object, _produtos.Object, _importacoes.Object);

    [Fact]
    public async Task Handle_ProdutoNomeExato_RetornaMatched()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "hash123", new List<LinhaRelatorio>
               {
                   new("001", "Croissant", "PADARIA", 10m, 100m)
               }));

        _importacoes.Setup(r => r.HashExisteAsync("hash123", default)).ReturnsAsync(false);

        var produto = CriarProduto(Guid.NewGuid(), "Croissant");
        _produtos.Setup(r => r.ListarAsync(false, default))
                 .ReturnsAsync(new List<Produto> { produto });

        var result = await CreateHandler().Handle(
            new ProcessarPreviewVendasCommand(Array.Empty<byte>(), "test.csv"), default);

        result.Itens.Should().HaveCount(1);
        result.Itens[0].Status.Should().Be(StatusImportacao.Matched);
        result.Itens[0].ProdutoId.Should().Be(produto.Id);
        result.TotalMatched.Should().Be(1);
    }

    [Fact]
    public async Task Handle_HashDuplicado_ThrowsDomainException()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "hash_dup", new List<LinhaRelatorio>
               {
                   new(null, "Produto X", null, 1m, 10m)
               }));

        _importacoes.Setup(r => r.HashExisteAsync("hash_dup", default)).ReturnsAsync(true);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(new List<Produto>());

        var act = async () => await CreateHandler().Handle(
            new ProcessarPreviewVendasCommand(Array.Empty<byte>(), "dup.csv"), default);

        await act.Should().ThrowAsync<CasaDiAna.Domain.Exceptions.DomainException>()
            .WithMessage("*já foi importado*");
    }

    [Fact]
    public async Task Handle_NenhumaLinhaNoRelatorio_ThrowsDomainException()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "hash_empty",
                   new List<LinhaRelatorio>()));

        _importacoes.Setup(r => r.HashExisteAsync(It.IsAny<string>(), default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(new List<Produto>());

        var act = async () => await CreateHandler().Handle(
            new ProcessarPreviewVendasCommand(Array.Empty<byte>(), "empty.csv"), default);

        await act.Should().ThrowAsync<CasaDiAna.Domain.Exceptions.DomainException>()
            .WithMessage("*Nenhuma linha*");
    }

    [Fact]
    public async Task Handle_ProdutoSemMatch_RetornaUnmatched()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "hash_x", new List<LinhaRelatorio>
               {
                   new(null, "Produto Inexistente", null, 5m, 50m)
               }));

        _importacoes.Setup(r => r.HashExisteAsync("hash_x", default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default))
                 .ReturnsAsync(new List<Produto> { CriarProduto(Guid.NewGuid(), "Outro Produto") });

        var result = await CreateHandler().Handle(
            new ProcessarPreviewVendasCommand(Array.Empty<byte>(), "t.csv"), default);

        result.Itens[0].Status.Should().Be(StatusImportacao.Unmatched);
        result.TotalUnmatched.Should().Be(1);
    }

    private static Produto CriarProduto(Guid id, string nome)
    {
        var produto = (Produto)System.Runtime.CompilerServices.RuntimeHelpers
            .GetUninitializedObject(typeof(Produto));

        typeof(Produto).GetProperty(nameof(Produto.Id))!
            .SetValue(produto, id);
        typeof(Produto).GetProperty(nameof(Produto.Nome))!
            .SetValue(produto, nome);
        typeof(Produto).GetProperty(nameof(Produto.Ativo))!
            .SetValue(produto, true);
        typeof(Produto).GetProperty(nameof(Produto.PrecoVenda))!
            .SetValue(produto, 10m);

        return produto;
    }

    [Fact]
    public async Task Handle_LinhasDeTaxaEEntrega_RetornaRepasseComTotais()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "hash_rep", new List<LinhaRelatorio>
               {
                   new("001", "Croissant", null, 10m, 100m),
                   new("77", "TAXA DE SERVIÇO", null, 411m, 3719.4m),
                   new("50", "Entrega longe", null, 5m, 50m),
                   new("51", "Entrega perto", null, 3m, 15m),
               }));
        _importacoes.Setup(r => r.HashExisteAsync("hash_rep", default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default))
                 .ReturnsAsync(new List<Produto> { CriarProduto(Guid.NewGuid(), "Croissant") });

        var result = await CreateHandler().Handle(
            new ProcessarPreviewVendasCommand(Array.Empty<byte>(), "rep.csv"), default);

        var taxa = result.Itens.Single(i => i.NomeRelatorio == "TAXA DE SERVIÇO");
        taxa.Status.Should().Be(StatusImportacao.Repasse);
        taxa.TipoRepasse.Should().Be(TipoRepasse.TaxaServico);
        taxa.ProdutoId.Should().BeNull();
        taxa.Sugestoes.Should().BeEmpty();

        result.Itens.Single(i => i.NomeRelatorio == "Entrega longe").TipoRepasse.Should().Be(TipoRepasse.Entrega);
        result.TotalMatched.Should().Be(1);
        result.TotalRepasses.Should().Be(3);
        result.TotalTaxaServico.Should().Be(3719.4m);
        result.TotalEntregas.Should().Be(65m);
        result.TotalIgnored.Should().Be(0);
    }

    [Fact]
    public async Task Handle_CsvSoComRepasses_NaoLancaExcecao()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new VendasParseResult(null, null, "hash_so_rep", new List<LinhaRelatorio>
               {
                   new("77", "TAXA DE SERVIÇO", null, 10m, 90m),
               }));
        _importacoes.Setup(r => r.HashExisteAsync("hash_so_rep", default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(new List<Produto>());

        var result = await CreateHandler().Handle(
            new ProcessarPreviewVendasCommand(Array.Empty<byte>(), "so_rep.csv"), default);

        result.Itens.Should().ContainSingle(i => i.Status == StatusImportacao.Repasse);
        result.TotalTaxaServico.Should().Be(90m);
    }
}
