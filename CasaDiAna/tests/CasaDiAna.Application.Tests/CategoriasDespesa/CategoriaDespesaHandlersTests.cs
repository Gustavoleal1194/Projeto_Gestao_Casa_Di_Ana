using CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using CategoriaDespesaEntity = CasaDiAna.Domain.Entities.CategoriaDespesa;

namespace CasaDiAna.Application.Tests.CategoriasDespesa;

public class CategoriaDespesaHandlersTests
{
    private readonly Mock<ICategoriaDespesaRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public CategoriaDespesaHandlersTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    [Fact]
    public async Task Criar_DevePersistir_QuandoNomeNaoExiste()
    {
        _repo.Setup(r => r.NomeExisteAsync("Frete", null, default)).ReturnsAsync(false);
        _repo.Setup(r => r.AdicionarAsync(It.IsAny<CategoriaDespesaEntity>(), default)).Returns(Task.CompletedTask);
        var handler = new CriarCategoriaDespesaCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new CriarCategoriaDespesaCommand("Frete", TipoDespesa.Variavel, false), CancellationToken.None);

        dto.Nome.Should().Be("Frete");
        dto.Tipo.Should().Be(TipoDespesa.Variavel);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<CategoriaDespesaEntity>(), default), Times.Once);
    }

    [Fact]
    public async Task Criar_DeveLancar_QuandoNomeDuplicado()
    {
        _repo.Setup(r => r.NomeExisteAsync("Aluguel", null, default)).ReturnsAsync(true);
        var handler = new CriarCategoriaDespesaCommandHandler(_repo.Object, _user.Object);

        var acao = () => handler.Handle(new CriarCategoriaDespesaCommand("Aluguel", TipoDespesa.Fixa, false), CancellationToken.None);
        await acao.Should().ThrowAsync<DomainException>().WithMessage("*já existe*");
    }
}
