using System.Reflection;
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Application.Tests.Despesas;

public static class DespesaTestFactory
{
    public static Despesa ComCategoria(DateTime competencia, CategoriaDespesa categoria, decimal valor)
    {
        var d = Despesa.Criar(competencia, categoria.Id, null, valor, null, competencia, Guid.NewGuid());
        typeof(Despesa).GetProperty("Categoria")!.SetValue(d, categoria);
        return d;
    }
}
