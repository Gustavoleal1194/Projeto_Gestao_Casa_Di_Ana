using CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.CategoriasUtensilio;

public class CriarCategoriaUtensilioCommandHandlerTests
{
    private readonly Mock<ICategoriaUtensilioRepository> _repositorio = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CriarCategoriaUtensilioCommandHandler _handler;

    public CriarCategoriaUtensilioCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _handler = new CriarCategoriaUtensilioCommandHandler(_repositorio.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveCriarCategoria_QuandoNomeUnico()
    {
        _repositorio.Setup(r => r.NomeExisteAsync("Limpeza", null, default)).ReturnsAsync(false);
        _repositorio.Setup(r => r.AdicionarAsync(It.IsAny<Domain.Entities.CategoriaUtensilio>(), default)).Returns(Task.CompletedTask);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(new CriarCategoriaUtensilioCommand("Limpeza"), CancellationToken.None);

        resultado.Nome.Should().Be("Limpeza");
        resultado.Ativo.Should().BeTrue();
        _repositorio.Verify(r => r.AdicionarAsync(It.IsAny<Domain.Entities.CategoriaUtensilio>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoNomeJaExiste()
    {
        _repositorio.Setup(r => r.NomeExisteAsync("Limpeza", null, default)).ReturnsAsync(true);

        var acao = () => _handler.Handle(new CriarCategoriaUtensilioCommand("Limpeza"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("*Limpeza*");
    }
}
