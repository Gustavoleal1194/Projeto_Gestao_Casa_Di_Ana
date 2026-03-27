using CasaDiAna.Application.Common;
using CasaDiAna.Application.Fornecedores.Commands.CriarFornecedor;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Fornecedores;

public class CriarFornecedorCommandHandlerTests
{
    private readonly Mock<IFornecedorRepository> _repositorio = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly CriarFornecedorCommandHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public CriarFornecedorCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _handler = new CriarFornecedorCommandHandler(_repositorio.Object, _currentUser.Object);
    }

    [Fact]
    public async Task DeveCriar_QuandoDadosValidos()
    {
        _repositorio.Setup(r => r.CnpjExisteAsync(It.IsAny<string>(), null, default)).ReturnsAsync(false);
        _repositorio.Setup(r => r.AdicionarAsync(It.IsAny<Fornecedor>(), default)).Returns(Task.CompletedTask);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new CriarFornecedorCommand("Distribuidora ABC", Cnpj: "12345678000199"),
            CancellationToken.None);

        resultado.RazaoSocial.Should().Be("Distribuidora ABC");
        resultado.Cnpj.Should().Be("12345678000199");
        resultado.Ativo.Should().BeTrue();
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoCnpjJaExiste()
    {
        _repositorio.Setup(r => r.CnpjExisteAsync("12345678000199", null, default)).ReturnsAsync(true);

        var acao = () => _handler.Handle(
            new CriarFornecedorCommand("Outro Fornecedor", Cnpj: "12345678000199"),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>()
            .WithMessage("*12345678000199*");
    }

    [Fact]
    public async Task DeveCriar_SemCnpj()
    {
        _repositorio.Setup(r => r.AdicionarAsync(It.IsAny<Fornecedor>(), default)).Returns(Task.CompletedTask);
        _repositorio.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);

        var resultado = await _handler.Handle(
            new CriarFornecedorCommand("Fornecedor Sem CNPJ"),
            CancellationToken.None);

        resultado.RazaoSocial.Should().Be("Fornecedor Sem CNPJ");
        resultado.Cnpj.Should().BeNull();
    }
}
