using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class EntradaMercadoriaEdicaoTests
{
    private static readonly DateTime Hoje = new(2026, 10, 13);
    private readonly Guid _criadoPor = Guid.NewGuid();
    private readonly Guid _editadoPor = Guid.NewGuid();

    private EntradaMercadoria NovaEntrada() =>
        EntradaMercadoria.Criar(Guid.NewGuid(), Hoje, _criadoPor, "NF-1", "Ana", "obs");

    [Fact]
    public void AtualizarCabecalho_DeveAlterarCampos_ERegistrarAuditoria()
    {
        var entrada = NovaEntrada();
        var novoFornecedor = Guid.NewGuid();
        var novaData = Hoje.AddDays(-2);

        entrada.AtualizarCabecalho(novoFornecedor, novaData, "NF-2", "Bia", null, _editadoPor);

        entrada.FornecedorId.Should().Be(novoFornecedor);
        entrada.DataEntrada.Should().Be(novaData);
        entrada.NumeroNotaFiscal.Should().Be("NF-2");
        entrada.RecebidoPor.Should().Be("Bia");
        entrada.Observacoes.Should().BeNull();
        entrada.AtualizadoPor.Should().Be(_editadoPor);
        entrada.Status.Should().Be(StatusEntrada.Confirmada);
    }

    [Fact]
    public void AtualizarCabecalho_EntradaCancelada_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.Cancelar(_criadoPor);

        var acao = () => entrada.AtualizarCabecalho(Guid.NewGuid(), Hoje, null, "Ana", null, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }

    [Fact]
    public void AlterarCustoItem_DeveRecalcularCustoTotal()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItem(Guid.NewGuid(), 10m, 5m);
        var item = entrada.Itens.Single();

        entrada.AlterarCustoItem(item.Id, 7.5m, _editadoPor);

        item.CustoUnitario.Should().Be(7.5m);
        item.CustoTotal.Should().Be(75m);
        entrada.CustoTotal.Should().Be(75m);
        entrada.AtualizadoPor.Should().Be(_editadoPor);
    }

    [Fact]
    public void AlterarCustoItem_CustoNegativo_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItem(Guid.NewGuid(), 10m, 5m);

        var acao = () => entrada.AlterarCustoItem(entrada.Itens.Single().Id, -1m, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("Custo unitário não pode ser negativo.");
    }

    [Fact]
    public void AlterarCustoItem_ItemDeOutraEntrada_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItem(Guid.NewGuid(), 10m, 5m);

        var acao = () => entrada.AlterarCustoItem(Guid.NewGuid(), 1m, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("Item não pertence a esta entrada.");
    }

    [Fact]
    public void AlterarCustoItem_EntradaCancelada_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItem(Guid.NewGuid(), 10m, 5m);
        entrada.Cancelar(_criadoPor);

        var acao = () => entrada.AlterarCustoItem(entrada.Itens.Single().Id, 1m, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }

    [Fact]
    public void AlterarCustoItemUtensilio_DeveRecalcularCustoTotal()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItemUtensilio(Guid.NewGuid(), 4m, 3m);
        var item = entrada.ItensUtensilio.Single();

        entrada.AlterarCustoItemUtensilio(item.Id, 2m, _editadoPor);

        item.CustoTotal.Should().Be(8m);
    }

    [Fact]
    public void AlterarCustoItemUtensilio_ItemInexistente_DeveLancar()
    {
        var entrada = NovaEntrada();

        var acao = () => entrada.AlterarCustoItemUtensilio(Guid.NewGuid(), 1m, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("Item não pertence a esta entrada.");
    }

    [Fact]
    public void SubstituirBoletos_DeveManterExistentes_RemoverAusentes_EAdicionarNovos()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(10));
        entrada.AdicionarBoleto(Hoje.AddDays(20));
        var mantido = entrada.Boletos.Single(b => b.DataVencimento == Hoje.AddDays(10));
        var removido = entrada.Boletos.Single(b => b.DataVencimento == Hoje.AddDays(20));

        var alteracao = entrada.SubstituirBoletos(
            new[] { Hoje.AddDays(10), Hoje.AddDays(30) }, Hoje, _editadoPor);

        entrada.Boletos.Select(b => b.DataVencimento)
            .Should().BeEquivalentTo(new[] { Hoje.AddDays(10), Hoje.AddDays(30) });
        entrada.Boletos.Should().Contain(mantido);
        alteracao.Removidos.Should().ContainSingle().Which.Should().Be(removido);
        alteracao.Adicionados.Should().ContainSingle()
            .Which.DataVencimento.Should().Be(Hoje.AddDays(30));
    }

    [Fact]
    public void SubstituirBoletos_DataExistenteNoPassado_DeveSerAceita()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(-5));

        var alteracao = entrada.SubstituirBoletos(
            new[] { Hoje.AddDays(-5).AddHours(3) }, Hoje, _editadoPor);

        alteracao.Removidos.Should().BeEmpty();
        alteracao.Adicionados.Should().BeEmpty();
        entrada.Boletos.Should().ContainSingle();
    }

    [Fact]
    public void SubstituirBoletos_DataNovaNoPassado_DeveLancar_SemAlterarBoletos()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(10));

        var acao = () => entrada.SubstituirBoletos(new[] { Hoje.AddDays(-1) }, Hoje, _editadoPor);

        acao.Should().Throw<DomainException>()
            .WithMessage("A data de vencimento do boleto deve ser hoje ou no futuro.");
        entrada.Boletos.Should().ContainSingle()
            .Which.DataVencimento.Should().Be(Hoje.AddDays(10));
    }

    [Fact]
    public void SubstituirBoletos_ListaVazia_DeveRemoverTodos()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(10));
        entrada.AdicionarBoleto(Hoje.AddDays(20));

        var alteracao = entrada.SubstituirBoletos(Array.Empty<DateTime>(), Hoje, _editadoPor);

        entrada.Boletos.Should().BeEmpty();
        alteracao.Removidos.Should().HaveCount(2);
    }

    [Fact]
    public void SubstituirBoletos_DatasRepetidas_DeveManterUmBoletoPorOcorrencia()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(10));

        var alteracao = entrada.SubstituirBoletos(
            new[] { Hoje.AddDays(10), Hoje.AddDays(10) }, Hoje, _editadoPor);

        entrada.Boletos.Should().HaveCount(2);
        alteracao.Adicionados.Should().ContainSingle();
    }

    [Fact]
    public void SubstituirBoletos_EntradaCancelada_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.Cancelar(_criadoPor);

        var acao = () => entrada.SubstituirBoletos(Array.Empty<DateTime>(), Hoje, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }
}
