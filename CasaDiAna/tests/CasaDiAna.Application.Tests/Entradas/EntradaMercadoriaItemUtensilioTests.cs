using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class EntradaMercadoriaItemUtensilioTests
{
    [Fact]
    public void AdicionarItemUtensilio_DeveAdicionar_QuandoDadosValidos()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var utensilioId = Guid.NewGuid();

        entrada.AdicionarItemUtensilio(utensilioId, 3m, 12.50m);

        entrada.ItensUtensilio.Should().HaveCount(1);
        entrada.ItensUtensilio.First().UtensilioId.Should().Be(utensilioId);
        entrada.ItensUtensilio.First().CustoTotal.Should().Be(37.50m);
    }

    [Fact]
    public void AdicionarItemUtensilio_DeveLancarExcecao_QuandoQuantidadeZeroOuNegativa()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());

        var acao = () => entrada.AdicionarItemUtensilio(Guid.NewGuid(), 0m, 5m);

        acao.Should().Throw<DomainException>().WithMessage("*Quantidade*");
    }

    [Fact]
    public void AdicionarItemUtensilio_DeveLancarExcecao_QuandoUtensilioDuplicado()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var utensilioId = Guid.NewGuid();
        entrada.AdicionarItemUtensilio(utensilioId, 1m, 5m);

        var acao = () => entrada.AdicionarItemUtensilio(utensilioId, 2m, 5m);

        acao.Should().Throw<DomainException>().WithMessage("*já adicionado*");
    }

    [Fact]
    public void AdicionarItemUtensilio_DeveLancarExcecao_QuandoEntradaCancelada()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        entrada.Cancelar(Guid.NewGuid());

        var acao = () => entrada.AdicionarItemUtensilio(Guid.NewGuid(), 1m, 5m);

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }

    [Fact]
    public void Itens_EItensUtensilio_PodemCoexistirNaMesmaEntrada()
    {
        var entrada = EntradaMercadoria.Criar(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        entrada.AdicionarItem(Guid.NewGuid(), 2m, 3m);
        entrada.AdicionarItemUtensilio(Guid.NewGuid(), 1m, 10m);

        entrada.Itens.Should().HaveCount(1);
        entrada.ItensUtensilio.Should().HaveCount(1);
    }
}
