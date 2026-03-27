using CasaDiAna.Application.Common;
using CasaDiAna.Application.Ingredientes.Commands.CriarIngrediente;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Ingredientes;

public class CriarIngredienteCommandHandlerTests
{
    private readonly Mock<IIngredienteRepository> _repositorio = new();
    private readonly Mock<IUnidadeMedidaRepository> _unidades = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CriarIngredienteCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public CriarIngredienteCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new CriarIngredienteCommandHandler(
            _repositorio.Object, _unidades.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveCriar_QuandoDadosValidos()
    {
        var command = new CriarIngredienteCommand("Farinha de Trigo", 1, 5m);
        _unidades.Setup(u => u.ExisteAsync(1, default)).ReturnsAsync(true);
        _repositorio.Setup(r => r.CodigoInternoExisteAsync(It.IsAny<string>(), null, default)).ReturnsAsync(false);
        _repositorio.Setup(r => r.AdicionarAsync(It.IsAny<Ingrediente>(), default)).Returns(Task.CompletedTask);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var salvo = Ingrediente.Criar("Farinha de Trigo", 1, 5m, _usuarioId);
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(salvo);

        var resultado = await _handler.Handle(command, CancellationToken.None);

        resultado.Nome.Should().Be("Farinha de Trigo");
        resultado.EstoqueMinimo.Should().Be(5m);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUnidadeNaoExiste()
    {
        _unidades.Setup(u => u.ExisteAsync(99, default)).ReturnsAsync(false);

        var acao = () => _handler.Handle(
            new CriarIngredienteCommand("Farinha", 99, 0m), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Unidade de medida não encontrada.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCodigoInternoJaExiste()
    {
        _unidades.Setup(u => u.ExisteAsync(1, default)).ReturnsAsync(true);
        _repositorio.Setup(r => r.CodigoInternoExisteAsync("FAR001", null, default)).ReturnsAsync(true);

        var acao = () => _handler.Handle(
            new CriarIngredienteCommand("Farinha", 1, 0m, CodigoInterno: "FAR001"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*FAR001*");
    }
}
