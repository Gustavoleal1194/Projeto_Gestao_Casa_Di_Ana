using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Commands.IniciarInventario;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Inventarios;

public class IniciarInventarioCommandHandlerTests
{
    private readonly Mock<IInventarioRepository> _inventarios = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly IniciarInventarioCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public IniciarInventarioCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new IniciarInventarioCommandHandler(_inventarios.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveIniciarInventario_QuandoDadosValidos()
    {
        var inventarioRetornado = Inventario.Criar(DateTime.UtcNow, _usuarioId, "Inventário Março");

        _inventarios.Setup(r => r.AdicionarAsync(It.IsAny<Inventario>(), default)).Returns(Task.CompletedTask);
        _inventarios.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(inventarioRetornado);

        var resultado = await _handler.Handle(
            new IniciarInventarioCommand(DateTime.UtcNow, "Inventário Março"),
            CancellationToken.None);

        resultado.Should().NotBeNull();
        resultado.Status.Should().Be("EmAndamento");
        resultado.Descricao.Should().Be("Inventário Março");
    }

    [Fact]
    public async Task DeveIniciarInventario_SemDescricao()
    {
        var inventarioRetornado = Inventario.Criar(DateTime.UtcNow, _usuarioId);

        _inventarios.Setup(r => r.AdicionarAsync(It.IsAny<Inventario>(), default)).Returns(Task.CompletedTask);
        _inventarios.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _inventarios.Setup(r => r.ObterPorIdComItensAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(inventarioRetornado);

        var resultado = await _handler.Handle(
            new IniciarInventarioCommand(DateTime.UtcNow),
            CancellationToken.None);

        resultado.Descricao.Should().BeNull();
        resultado.Itens.Should().BeEmpty();
    }
}
