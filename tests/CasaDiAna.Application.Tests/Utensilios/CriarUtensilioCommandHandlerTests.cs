using CasaDiAna.Application.Common;
using CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Utensilios;

public class CriarUtensilioCommandHandlerTests
{
    private readonly Mock<IUtensilioRepository> _repositorio = new();
    private readonly Mock<IUnidadeMedidaRepository> _unidades = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CriarUtensilioCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public CriarUtensilioCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new CriarUtensilioCommandHandler(_repositorio.Object, _unidades.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveCriar_QuandoDadosValidos()
    {
        var command = new CriarUtensilioCommand("Detergente Neutro", 1, 2m);
        _unidades.Setup(u => u.ExisteAsync(1, default)).ReturnsAsync(true);
        _repositorio.Setup(r => r.CodigoInternoExisteAsync(It.IsAny<string>(), null, default)).ReturnsAsync(false);
        _repositorio.Setup(r => r.AdicionarAsync(It.IsAny<Utensilio>(), default)).Returns(Task.CompletedTask);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var salvo = Utensilio.Criar("Detergente Neutro", 1, 2m, _usuarioId);
        _repositorio.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(salvo);

        var resultado = await _handler.Handle(command, CancellationToken.None);

        resultado.Nome.Should().Be("Detergente Neutro");
        resultado.EstoqueMinimo.Should().Be(2m);
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoUnidadeNaoExiste()
    {
        _unidades.Setup(u => u.ExisteAsync(99, default)).ReturnsAsync(false);

        var acao = () => _handler.Handle(
            new CriarUtensilioCommand("Detergente", 99, 0m), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("Unidade de medida não encontrada.");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCodigoInternoJaExiste()
    {
        _unidades.Setup(u => u.ExisteAsync(1, default)).ReturnsAsync(true);
        _repositorio.Setup(r => r.CodigoInternoExisteAsync("DET-001", null, default)).ReturnsAsync(true);

        var acao = () => _handler.Handle(
            new CriarUtensilioCommand("Detergente", 1, 0m, CodigoInterno: "DET-001"), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*DET-001*");
    }
}
