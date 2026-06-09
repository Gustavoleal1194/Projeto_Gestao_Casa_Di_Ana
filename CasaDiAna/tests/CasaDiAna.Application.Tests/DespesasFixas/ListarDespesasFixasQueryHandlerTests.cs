using CasaDiAna.Application.DespesasFixas.Queries.ListarDespesasFixas;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.DespesasFixas;

public class ListarDespesasFixasQueryHandlerTests
{
    [Fact]
    public async Task DeveSomarTotalETotalPorCategoria()
    {
        var comp = new DateTime(2026, 6, 1);
        var criadoPor = Guid.NewGuid();
        var lista = new List<DespesaFixa>
        {
            DespesaFixa.Criar(comp, CategoriaDespesaFixa.Aluguel, null, 3000m, null, comp, criadoPor),
            DespesaFixa.Criar(comp, CategoriaDespesaFixa.Energia, null, 800m, null, comp, criadoPor),
            DespesaFixa.Criar(comp, CategoriaDespesaFixa.Energia, null, 200m, null, comp, criadoPor),
        };
        var repo = new Mock<IDespesaFixaRepository>();
        repo.Setup(r => r.ListarPorCompetenciaAsync(comp, default)).ReturnsAsync(lista);
        var handler = new ListarDespesasFixasQueryHandler(repo.Object);

        var dto = await handler.Handle(new ListarDespesasFixasQuery(comp), CancellationToken.None);

        dto.Total.Should().Be(4000m);
        dto.Itens.Should().HaveCount(3);
        dto.TotalPorCategoria.Should().ContainSingle(c => c.Categoria == CategoriaDespesaFixa.Energia && c.Total == 1000m);
    }
}
