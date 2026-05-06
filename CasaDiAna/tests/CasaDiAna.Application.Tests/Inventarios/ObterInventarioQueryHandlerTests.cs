using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Queries.ObterInventario;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Inventarios;

public class ObterInventarioQueryHandlerTests
{
    private readonly Mock<IInventarioRepository> _inventarios = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly ObterInventarioQueryHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public ObterInventarioQueryHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _handler = new ObterInventarioQueryHandler(_inventarios.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveRetornarInventario_QuandoUsuarioEhDono()
    {
        var inventario = Inventario.Criar(DateTime.UtcNow, _usuarioId, "Março");
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(inventario.Id, default)).ReturnsAsync(inventario);

        var resultado = await _handler.Handle(new ObterInventarioQuery(inventario.Id), CancellationToken.None);

        resultado.Should().NotBeNull();
        resultado.Id.Should().Be(inventario.Id);
    }

    [Fact]
    public async Task DeveRetornarInventario_QuandoUsuarioEhAdmin()
    {
        var dono = Guid.NewGuid();
        var inventario = Inventario.Criar(DateTime.UtcNow, dono, "Março");
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Admin");
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(inventario.Id, default)).ReturnsAsync(inventario);

        var resultado = await _handler.Handle(new ObterInventarioQuery(inventario.Id), CancellationToken.None);

        resultado.Should().NotBeNull();
        resultado.Id.Should().Be(inventario.Id);
    }

    [Fact]
    public async Task DeveLancarUnauthorized_QuandoOutroUsuarioTentaAcessar()
    {
        var dono = Guid.NewGuid();
        var inventario = Inventario.Criar(DateTime.UtcNow, dono, "Março");
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(inventario.Id, default)).ReturnsAsync(inventario);

        var acao = () => _handler.Handle(new ObterInventarioQuery(inventario.Id), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Acesso negado*");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoInventarioNaoEncontrado()
    {
        var id = Guid.NewGuid();
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(id, default)).ReturnsAsync((Inventario?)null);

        var acao = () => _handler.Handle(new ObterInventarioQuery(id), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Inventário*");
    }
}
