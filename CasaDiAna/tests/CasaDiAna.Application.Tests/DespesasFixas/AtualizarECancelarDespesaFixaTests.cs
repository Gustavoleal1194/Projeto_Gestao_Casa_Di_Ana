using CasaDiAna.Application.Common;
using CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Commands.CancelarDespesaFixa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.DespesasFixas;

public class AtualizarECancelarDespesaFixaTests
{
    private readonly Mock<IDespesaFixaRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public AtualizarECancelarDespesaFixaTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    private static DespesaFixa Existente() => DespesaFixa.Criar(
        new DateTime(2026, 6, 1), CategoriaDespesaFixa.Energia, "Luz", 800m, null,
        new DateTime(2026, 6, 5), Guid.NewGuid());

    [Fact]
    public async Task Atualizar_DeveAlterarValorECategoria()
    {
        var despesa = Existente();
        _repo.Setup(r => r.ObterPorIdAsync(despesa.Id, default)).ReturnsAsync(despesa);
        var handler = new AtualizarDespesaFixaCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new AtualizarDespesaFixaCommand(
            despesa.Id, new DateTime(2026, 6, 1), CategoriaDespesaFixa.Agua, "Água", 950m, "reajuste",
            new DateTime(2026, 6, 5)), CancellationToken.None);

        dto.Categoria.Should().Be(CategoriaDespesaFixa.Agua);
        dto.Valor.Should().Be(950m);
        _repo.Verify(r => r.Atualizar(despesa), Times.Once);
        _repo.Verify(r => r.SalvarAsync(default), Times.Once);
    }

    [Fact]
    public async Task Atualizar_DeveLancar_QuandoNaoEncontrada()
    {
        _repo.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync((DespesaFixa?)null);
        var handler = new AtualizarDespesaFixaCommandHandler(_repo.Object, _user.Object);

        var acao = () => handler.Handle(new AtualizarDespesaFixaCommand(
            Guid.NewGuid(), new DateTime(2026, 6, 1), CategoriaDespesaFixa.Agua, null, 1m, null, DateTime.Today),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("Despesa não encontrada.");
    }

    [Fact]
    public async Task Cancelar_DeveMarcarInativo()
    {
        var despesa = Existente();
        _repo.Setup(r => r.ObterPorIdAsync(despesa.Id, default)).ReturnsAsync(despesa);
        var handler = new CancelarDespesaFixaCommandHandler(_repo.Object, _user.Object);

        await handler.Handle(new CancelarDespesaFixaCommand(despesa.Id), CancellationToken.None);

        despesa.Ativo.Should().BeFalse();
        _repo.Verify(r => r.Atualizar(despesa), Times.Once);
        _repo.Verify(r => r.SalvarAsync(default), Times.Once);
    }
}
