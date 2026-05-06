using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Queries.ObterEntrada;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Entradas;

public class ObterEntradaQueryHandlerTests
{
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly ObterEntradaQueryHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public ObterEntradaQueryHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _currentUser.Setup(u => u.Papel).Returns("Operador");
        _handler = new ObterEntradaQueryHandler(_entradas.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveRetornarEntrada_QuandoUsuarioEhDono()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, _usuarioId);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entrada.Id, default)).ReturnsAsync(entrada);

        var resultado = await _handler.Handle(new ObterEntradaQuery(entrada.Id), CancellationToken.None);

        resultado.Should().NotBeNull();
        resultado.Id.Should().Be(entrada.Id);
    }

    [Fact]
    public async Task DeveRetornarEntrada_QuandoUsuarioEhAdmin()
    {
        var donoDaEntrada = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, donoDaEntrada);
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _currentUser.Setup(u => u.Papel).Returns("Admin");
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entrada.Id, default)).ReturnsAsync(entrada);

        var resultado = await _handler.Handle(new ObterEntradaQuery(entrada.Id), CancellationToken.None);

        resultado.Should().NotBeNull();
        resultado.Id.Should().Be(entrada.Id);
    }

    [Fact]
    public async Task DeveLancarUnauthorized_QuandoOutroUsuarioTentaAcessar()
    {
        var donoDaEntrada = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, donoDaEntrada);
        _currentUser.Setup(u => u.UsuarioId).Returns(Guid.NewGuid()); // usuário diferente, não é dono
        _currentUser.Setup(u => u.Papel).Returns("Operador");         // não é admin
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entrada.Id, default)).ReturnsAsync(entrada);

        var acao = () => _handler.Handle(new ObterEntradaQuery(entrada.Id), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Acesso negado*");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoEntradaNaoEncontrada()
    {
        var entradaId = Guid.NewGuid();
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entradaId, default))
            .ReturnsAsync((EntradaMercadoria?)null);

        var acao = () => _handler.Handle(new ObterEntradaQuery(entradaId), CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*Entrada*");
    }
}
