using CasaDiAna.Application.Despesas.Queries.ObterComprasMes;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Despesas;

public class ObterComprasMesQueryHandlerTests
{
    [Fact]
    public async Task DeveSomarSomenteConfirmadas()
    {
        var comp = new DateTime(2026, 6, 1);
        var user = Guid.NewGuid();
        var forn = Guid.NewGuid();
        var ingrediente = Guid.NewGuid();

        var confirmada = EntradaMercadoria.Criar(forn, new DateTime(2026, 6, 10), user, numeroNotaFiscal: "NF-1");
        confirmada.AdicionarItem(ingrediente, 10m, 5m);   // 50
        var cancelada = EntradaMercadoria.Criar(forn, new DateTime(2026, 6, 12), user, numeroNotaFiscal: "NF-2");
        cancelada.AdicionarItem(ingrediente, 3m, 5m);     // 15
        cancelada.Cancelar(user);

        var repo = new Mock<IEntradaMercadoriaRepository>();
        repo.Setup(r => r.ListarAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), default))
            .ReturnsAsync(new List<EntradaMercadoria> { confirmada, cancelada });

        var handler = new ObterComprasMesQueryHandler(repo.Object);
        var dto = await handler.Handle(new ObterComprasMesQuery(comp), CancellationToken.None);

        dto.TotalCompras.Should().Be(50m);
        dto.Itens.Should().ContainSingle();
        dto.Itens[0].NumeroNotaFiscal.Should().Be("NF-1");
    }
}
