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
    private readonly Mock<IPdfVendasParser> _parser = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<IImportacaoVendasRepository> _importacoes = new();

    private ProcessarPreviewPdfVendasCommandHandler CreateHandler() =>
        new(_parser.Object, _produtos.Object, _importacoes.Object);

    [Fact]
    public async Task Handle_ProdutoNomeExato_RetornaMatched()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new PdfParseResult(null, null, "hash123", new List<LinhaRelatorio>
               {
                   new("001", "Croissant", "PADARIA", 10m, 100m)
               }));

        _importacoes.Setup(r => r.HashExisteAsync("hash123", default)).ReturnsAsync(false);

        var produto = CriarProduto(Guid.NewGuid(), "Croissant");
        _produtos.Setup(r => r.ListarAsync(false, default))
                 .ReturnsAsync(new List<Produto> { produto });

        var result = await CreateHandler().Handle(
            new ProcessarPreviewPdfVendasCommand(Array.Empty<byte>(), "test.pdf"), default);

        result.Itens.Should().HaveCount(1);
        result.Itens[0].Status.Should().Be(StatusImportacao.Matched);
        result.Itens[0].ProdutoId.Should().Be(produto.Id);
        result.TotalMatched.Should().Be(1);
    }

    [Fact]
    public async Task Handle_HashDuplicado_ThrowsDomainException()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new PdfParseResult(null, null, "hash_dup", new List<LinhaRelatorio>
               {
                   new(null, "Produto X", null, 1m, 10m)
               }));

        _importacoes.Setup(r => r.HashExisteAsync("hash_dup", default)).ReturnsAsync(true);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(new List<Produto>());

        var act = async () => await CreateHandler().Handle(
            new ProcessarPreviewPdfVendasCommand(Array.Empty<byte>(), "dup.pdf"), default);

        await act.Should().ThrowAsync<CasaDiAna.Domain.Exceptions.DomainException>()
            .WithMessage("*já foi importado*");
    }

    [Fact]
    public async Task Handle_NenhumaLinhaNoRelatorio_ThrowsDomainException()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new PdfParseResult(null, null, "hash_empty",
                   new List<LinhaRelatorio>()));

        _importacoes.Setup(r => r.HashExisteAsync(It.IsAny<string>(), default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default)).ReturnsAsync(new List<Produto>());

        var act = async () => await CreateHandler().Handle(
            new ProcessarPreviewPdfVendasCommand(Array.Empty<byte>(), "empty.pdf"), default);

        await act.Should().ThrowAsync<CasaDiAna.Domain.Exceptions.DomainException>()
            .WithMessage("*Nenhuma linha*");
    }

    [Fact]
    public async Task Handle_ProdutoSemMatch_RetornaUnmatched()
    {
        _parser.Setup(p => p.Parse(It.IsAny<byte[]>()))
               .Returns(new PdfParseResult(null, null, "hash_x", new List<LinhaRelatorio>
               {
                   new(null, "Produto Inexistente", null, 5m, 50m)
               }));

        _importacoes.Setup(r => r.HashExisteAsync("hash_x", default)).ReturnsAsync(false);
        _produtos.Setup(r => r.ListarAsync(false, default))
                 .ReturnsAsync(new List<Produto> { CriarProduto(Guid.NewGuid(), "Outro Produto") });

        var result = await CreateHandler().Handle(
            new ProcessarPreviewPdfVendasCommand(Array.Empty<byte>(), "t.pdf"), default);

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
}
