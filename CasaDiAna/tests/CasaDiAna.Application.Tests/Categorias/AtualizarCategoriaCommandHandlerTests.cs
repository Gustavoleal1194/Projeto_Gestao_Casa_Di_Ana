using CasaDiAna.Application.Categorias.Commands.AtualizarCategoria;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Categorias;

public class AtualizarCategoriaCommandHandlerTests
{
    private readonly Mock<ICategoriaIngredienteRepository> _repositorio = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly AtualizarCategoriaCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public AtualizarCategoriaCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new AtualizarCategoriaCommandHandler(_repositorio.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveAtualizar_QuandoCategoriaExisteENomeUnico()
    {
        var id = Guid.NewGuid();
        var categoria = CategoriaIngrediente.Criar("Grãos", _usuarioId);
        _repositorio.Setup(r => r.ObterPorIdAsync(id, default)).ReturnsAsync(categoria);
        _repositorio.Setup(r => r.NomeExisteAsync("Cereais", id, default)).ReturnsAsync(false);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new AtualizarCategoriaCommand(id, "Cereais"), CancellationToken.None);

        resultado.Nome.Should().Be("Cereais");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCategoriaNaoEncontrada()
    {
        var id = Guid.NewGuid();
        _repositorio.Setup(r => r.ObterPorIdAsync(id, default)).ReturnsAsync((CategoriaIngrediente?)null);

        var acao = () => _handler.Handle(
            new AtualizarCategoriaCommand(id, "Cereais"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Categoria não encontrada.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoNomeJaUsadoPorOutra()
    {
        var id = Guid.NewGuid();
        var categoria = CategoriaIngrediente.Criar("Grãos", _usuarioId);
        _repositorio.Setup(r => r.ObterPorIdAsync(id, default)).ReturnsAsync(categoria);
        _repositorio.Setup(r => r.NomeExisteAsync("Cereais", id, default)).ReturnsAsync(true);

        var acao = () => _handler.Handle(
            new AtualizarCategoriaCommand(id, "Cereais"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Cereais*");
    }
}
