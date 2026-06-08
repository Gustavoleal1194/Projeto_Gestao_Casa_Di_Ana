using CasaDiAna.Application.Produtos.Commands.DefinirCustoUnitario;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Produtos;

public class DefinirCustoUnitarioCommandHandlerTests
{
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly DefinirCustoUnitarioCommandHandler _handler;

    public DefinirCustoUnitarioCommandHandlerTests()
        => _handler = new DefinirCustoUnitarioCommandHandler(_produtos.Object);

    [Fact]
    public async Task Handle_DeveDefinirCusto_QuandoProdutoRevenda()
    {
        var produto = Produto.Criar("Coca-Cola", 7m, Guid.NewGuid(), tipo: TipoProduto.Revenda);
        _produtos.Setup(r => r.ObterPorIdComFichaAsync(produto.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(produto);

        var dto = await _handler.Handle(
            new DefinirCustoUnitarioCommand(produto.Id, 3.5m), CancellationToken.None);

        produto.CustoUnitario.Should().Be(3.5m);
        dto.CustoTotal.Should().Be(3.5m);
        dto.Tipo.Should().Be(TipoProduto.Revenda);
        dto.Itens.Should().BeEmpty();
        _produtos.Verify(r => r.SalvarAsync(It.IsAny<CancellationToken>()), Times.Once);
        _produtos.Verify(r => r.Atualizar(produto), Times.Once);
    }

    [Fact]
    public async Task Handle_DeveLancar_QuandoProdutoNaoEncontrado()
    {
        _produtos.Setup(r => r.ObterPorIdComFichaAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Produto?)null);
        var acao = async () => await _handler.Handle(
            new DefinirCustoUnitarioCommand(Guid.NewGuid(), 3m), CancellationToken.None);
        await acao.Should().ThrowAsync<DomainException>();
    }
}
