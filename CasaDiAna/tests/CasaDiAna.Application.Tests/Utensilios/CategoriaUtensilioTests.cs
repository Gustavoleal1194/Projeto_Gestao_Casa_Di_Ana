using CasaDiAna.Domain.Entities;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Utensilios;

public class CategoriaUtensilioTests
{
    [Fact]
    public void Criar_DeveDefinirCampos()
    {
        var c = CategoriaUtensilio.Criar("Limpeza", Guid.NewGuid());

        c.Nome.Should().Be("Limpeza");
        c.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Atualizar_EDesativar_DeveFuncionar()
    {
        var c = CategoriaUtensilio.Criar("Limpeza", Guid.NewGuid());
        c.Atualizar("Embalagens", Guid.NewGuid());

        c.Nome.Should().Be("Embalagens");

        c.Desativar(Guid.NewGuid());
        c.Ativo.Should().BeFalse();
    }
}
