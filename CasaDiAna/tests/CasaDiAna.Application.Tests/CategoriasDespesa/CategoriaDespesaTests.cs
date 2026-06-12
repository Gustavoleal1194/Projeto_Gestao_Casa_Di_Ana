using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using FluentAssertions;
// Alias needed because the entity CategoriaDespesa and the enum CategoriaDespesa share the same simple name
using CategoriaDespesaEntity = CasaDiAna.Domain.Entities.CategoriaDespesa;

namespace CasaDiAna.Application.Tests.CategoriasDespesa;

public class CategoriaDespesaTests
{
    [Fact]
    public void Criar_DeveDefinirCampos()
    {
        var c = CategoriaDespesaEntity.Criar("Taxa de cartão", TipoDespesa.Variavel, false, Guid.NewGuid());
        c.Nome.Should().Be("Taxa de cartão");
        c.Tipo.Should().Be(TipoDespesa.Variavel);
        c.EhFolhaPagamento.Should().BeFalse();
        c.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Atualizar_EDesativar_DeveFuncionar()
    {
        var c = CategoriaDespesaEntity.Criar("Folha", TipoDespesa.Fixa, true, Guid.NewGuid());
        c.Atualizar("Folha de pagamento", TipoDespesa.Fixa, true, Guid.NewGuid());
        c.Nome.Should().Be("Folha de pagamento");
        c.EhFolhaPagamento.Should().BeTrue();
        c.Desativar(Guid.NewGuid());
        c.Ativo.Should().BeFalse();
    }
}
