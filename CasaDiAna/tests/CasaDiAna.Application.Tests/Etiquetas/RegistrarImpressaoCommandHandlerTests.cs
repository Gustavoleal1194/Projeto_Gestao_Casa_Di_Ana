using CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Etiquetas;

public class RegistrarImpressaoCommandHandlerTests
{
    private readonly Mock<IHistoricoImpressaoRepository> _historico = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly RegistrarImpressaoCommandHandler _handler;

    public RegistrarImpressaoCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _handler = new RegistrarImpressaoCommandHandler(
            _historico.Object,
            _produtos.Object,
            _currentUser.Object);
    }

    [Fact]
    public async Task DeveRegistrarImpressao_QuandoProdutoExiste()
    {
        var produtoId = Guid.NewGuid();
        var produto = Produto.Criar("Bolo", 10m, Guid.NewGuid());
        _produtos.Setup(r => r.ObterPorIdAsync(produtoId, default)).ReturnsAsync(produto);
        _historico.Setup(r => r.AdicionarAsync(It.IsAny<HistoricoImpressaoEtiqueta>(), default))
                  .Returns(Task.CompletedTask);
        _historico.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var command = new RegistrarImpressaoCommand(
            ProdutoId: produtoId,
            TipoEtiqueta: TipoEtiqueta.Completa,
            Quantidade: 5,
            DataProducao: DateTime.Today);

        var resultado = await _handler.Handle(command, CancellationToken.None);

        resultado.ProdutoId.Should().Be(produto.Id);
        resultado.Quantidade.Should().Be(5);
        resultado.TipoEtiqueta.Should().Be(TipoEtiqueta.Completa);
        _historico.Verify(r => r.AdicionarAsync(It.IsAny<HistoricoImpressaoEtiqueta>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoProdutoNaoEncontrado()
    {
        _produtos.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default))
                 .ReturnsAsync((Produto?)null);

        var command = new RegistrarImpressaoCommand(
            ProdutoId: Guid.NewGuid(),
            TipoEtiqueta: TipoEtiqueta.Simples,
            Quantidade: 1,
            DataProducao: DateTime.Today);

        var acao = () => _handler.Handle(command, CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Produto não encontrado.");
    }
}
