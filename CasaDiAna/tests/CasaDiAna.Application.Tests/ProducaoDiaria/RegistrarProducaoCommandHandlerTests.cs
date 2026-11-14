using CasaDiAna.Application.ProducaoDiaria.Commands.RegistrarProducao;
using CasaDiAna.Application.Tests.Estoque;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;
using ProducaoDiariaEntidade = CasaDiAna.Domain.Entities.ProducaoDiaria;

namespace CasaDiAna.Application.Tests.ProducaoDiaria;

public class RegistrarProducaoCommandHandlerTests
{
    private readonly BaixaFichaTecnicaFixture _f = new();
    private readonly Mock<IProducaoDiariaRepository> _producoes = new();
    private readonly Mock<IProdutoRepository> _produtos = new();
    private ProducaoDiariaEntidade? _gravada;

    public RegistrarProducaoCommandHandlerTests()
    {
        _producoes.Setup(r => r.AdicionarAsync(It.IsAny<ProducaoDiariaEntidade>(), default))
                  .Callback<ProducaoDiariaEntidade, CancellationToken>((p, _) => _gravada = p)
                  .Returns(Task.CompletedTask);
        _producoes.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    private RegistrarProducaoCommandHandler Criar(Produto produto)
    {
        _produtos.Setup(r => r.ObterPorIdComFichaAsync(produto.Id, default)).ReturnsAsync(produto);
        return new(_producoes.Object, _produtos.Object, _f.Servico(), _f.Usuario.Object);
    }

    private static RegistrarProducaoCommand Command(Produto produto, decimal quantidade) =>
        new(produto.Id, DateTime.Today, quantidade, null);

    [Fact]
    public async Task ProduzidoEmLote_BaixaInsumosERegistraCusto()
    {
        var farinha = _f.Ingrediente("Farinha", estoque: 10m, custoUnitario: 4m);
        var ovo = _f.Ingrediente("Ovo", estoque: 30m, custoUnitario: 0.8m);
        var bolo = _f.Produto("Bolo", TipoProduto.Produzido, (farinha, 0.5m), (ovo, 3m));

        var dto = await Criar(bolo).Handle(Command(bolo, 2m), default);

        farinha.EstoqueAtual.Should().Be(9m);
        ovo.EstoqueAtual.Should().Be(24m);
        dto.CustoTotal.Should().Be(2m * (0.5m * 4m + 3m * 0.8m));
        _f.MovimentacoesGravadas.Should().HaveCount(2).And.OnlyContain(m =>
            m.Tipo == TipoMovimentacao.SaidaProducao &&
            m.ReferenciaTipo == "ProducaoDiaria" &&
            m.ReferenciaId == _gravada!.Id);
    }

    [Fact]
    public async Task FeitoNaHora_RejeitaProducao()
    {
        var cafe = _f.Ingrediente("Café", estoque: 100m, custoUnitario: 0.1m);
        var espresso = _f.Produto("Espresso", TipoProduto.FeitoNaHora, (cafe, 10m));

        var act = () => Criar(espresso).Handle(Command(espresso, 1m), default);

        await act.Should().ThrowAsync<DomainException>().WithMessage("*feito na hora*");
        cafe.EstoqueAtual.Should().Be(100m);
    }

    [Fact]
    public async Task SemFicha_RejeitaProducao()
    {
        var bolo = _f.Produto("Bolo", TipoProduto.Produzido);

        var act = () => Criar(bolo).Handle(Command(bolo, 1m), default);

        await act.Should().ThrowAsync<DomainException>().WithMessage("*ficha técnica*");
    }
}
