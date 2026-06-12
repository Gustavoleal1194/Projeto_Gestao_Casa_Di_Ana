using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;
using CasaDiAna.Application.Despesas.Commands.CancelarDespesa;
using CasaDiAna.Application.Despesas.Commands.CriarDespesa;
using CasaDiAna.Application.Despesas.Queries.ListarDespesas;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using CategoriaDespesaEnum = CasaDiAna.Domain.Enums.CategoriaDespesa;

namespace CasaDiAna.Application.Tests.Despesas;

public class DespesaTests
{
    [Fact]
    public void Criar_DeveNormalizarCompetencia_ESalvarTipo()
    {
        var d = Despesa.Criar(new DateTime(2026, 6, 17), TipoDespesa.Variavel, CategoriaDespesaEnum.TaxaCartao,
            "Maquininha", 150m, null, new DateTime(2026, 6, 17), Guid.NewGuid());
        d.Competencia.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        d.Tipo.Should().Be(TipoDespesa.Variavel);
        d.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Criar_DeveLancar_QuandoValorZero()
    {
        var acao = () => Despesa.Criar(new DateTime(2026, 6, 1), TipoDespesa.Fixa, CategoriaDespesaEnum.Energia,
            null, 0m, null, DateTime.Today, Guid.NewGuid());
        acao.Should().Throw<DomainException>().WithMessage("Valor da despesa deve ser maior que zero.");
    }
}

public class DespesaHandlersTests
{
    private readonly Mock<IDespesaRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public DespesaHandlersTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    [Fact]
    public async Task Criar_DevePersistirComTipo()
    {
        _repo.Setup(r => r.AdicionarAsync(It.IsAny<Despesa>(), default)).Returns(Task.CompletedTask);
        var handler = new CriarDespesaCommandHandler(_repo.Object, _user.Object);
        var dto = await handler.Handle(new CriarDespesaCommand(
            new DateTime(2026, 6, 1), TipoDespesa.Fixa, CategoriaDespesaEnum.Aluguel, "Loja", 3000m, null, new DateTime(2026, 6, 1)),
            CancellationToken.None);
        dto.Tipo.Should().Be(TipoDespesa.Fixa);
        dto.Valor.Should().Be(3000m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<Despesa>(), default), Times.Once);
    }

    [Fact]
    public async Task Atualizar_DeveLancar_QuandoNaoEncontrada()
    {
        _repo.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync((Despesa?)null);
        var handler = new AtualizarDespesaCommandHandler(_repo.Object, _user.Object);
        var acao = () => handler.Handle(new AtualizarDespesaCommand(
            Guid.NewGuid(), new DateTime(2026, 6, 1), TipoDespesa.Fixa, CategoriaDespesaEnum.Agua, null, 1m, null, DateTime.Today),
            CancellationToken.None);
        await acao.Should().ThrowAsync<DomainException>().WithMessage("Despesa não encontrada.");
    }

    [Fact]
    public async Task Cancelar_DeveMarcarInativo()
    {
        var d = Despesa.Criar(new DateTime(2026, 6, 1), TipoDespesa.Fixa, CategoriaDespesaEnum.Gas, null, 200m, null,
            DateTime.Today, Guid.NewGuid());
        _repo.Setup(r => r.ObterPorIdAsync(d.Id, default)).ReturnsAsync(d);
        var handler = new CancelarDespesaCommandHandler(_repo.Object, _user.Object);
        await handler.Handle(new CancelarDespesaCommand(d.Id), CancellationToken.None);
        d.Ativo.Should().BeFalse();
        _repo.Verify(r => r.Atualizar(d), Times.Once);
    }

    [Fact]
    public async Task Listar_DeveSepararTotaisFixasEVariaveis()
    {
        var comp = new DateTime(2026, 6, 1); var u = Guid.NewGuid();
        var lista = new List<Despesa>
        {
            Despesa.Criar(comp, TipoDespesa.Fixa, CategoriaDespesaEnum.Aluguel, null, 3000m, null, comp, u),
            Despesa.Criar(comp, TipoDespesa.Variavel, CategoriaDespesaEnum.TaxaCartao, null, 200m, null, comp, u),
            Despesa.Criar(comp, TipoDespesa.Variavel, CategoriaDespesaEnum.Frete, null, 100m, null, comp, u),
        };
        _repo.Setup(r => r.ListarPorCompetenciaAsync(comp, default)).ReturnsAsync(lista);
        var handler = new ListarDespesasQueryHandler(_repo.Object);

        var todas = await handler.Handle(new ListarDespesasQuery(comp, null), CancellationToken.None);
        todas.TotalFixas.Should().Be(3000m);
        todas.TotalVariaveis.Should().Be(300m);
        todas.Itens.Should().HaveCount(3);

        var soVar = await handler.Handle(new ListarDespesasQuery(comp, TipoDespesa.Variavel), CancellationToken.None);
        soVar.Itens.Should().HaveCount(2);
        soVar.TotalFixas.Should().Be(3000m); // totais consideram o mês todo
    }
}
