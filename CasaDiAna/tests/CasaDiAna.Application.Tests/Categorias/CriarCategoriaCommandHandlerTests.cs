using CasaDiAna.Application.Categorias.Commands.CriarCategoria;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Categorias;

public class CriarCategoriaCommandHandlerTests
{
    private readonly Mock<ICategoriaIngredienteRepository> _repositorio = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CriarCategoriaCommandHandler _handler;

    public CriarCategoriaCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _handler = new CriarCategoriaCommandHandler(_repositorio.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveCriarCategoria_QuandoNomeUnico()
    {
        _repositorio.Setup(r => r.NomeExisteAsync("Laticínios", null, default)).ReturnsAsync(false);
        _repositorio.Setup(r => r.AdicionarAsync(It.IsAny<CategoriaIngrediente>(), default)).Returns(Task.CompletedTask);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(new CriarCategoriaCommand("Laticínios"), CancellationToken.None);

        resultado.Nome.Should().Be("Laticínios");
        resultado.Ativo.Should().BeTrue();
        _repositorio.Verify(r => r.AdicionarAsync(It.IsAny<CategoriaIngrediente>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoNomeJaExiste()
    {
        _repositorio.Setup(r => r.NomeExisteAsync("Laticínios", null, default)).ReturnsAsync(true);

        var acao = () => _handler.Handle(new CriarCategoriaCommand("Laticínios"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Laticínios*");
    }
}
