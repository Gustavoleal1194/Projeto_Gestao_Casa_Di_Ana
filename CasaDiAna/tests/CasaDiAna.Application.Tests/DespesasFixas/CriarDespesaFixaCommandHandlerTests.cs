using CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Application.Common;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.DespesasFixas;

public class CriarDespesaFixaCommandHandlerTests
{
    private readonly Mock<IDespesaFixaRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();
    private readonly CriarDespesaFixaCommandHandler _handler;

    public CriarDespesaFixaCommandHandlerTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.AdicionarAsync(It.IsAny<DespesaFixa>(), default)).Returns(Task.CompletedTask);
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _handler = new CriarDespesaFixaCommandHandler(_repo.Object, _user.Object);
    }

    [Fact]
    public async Task DeveCriarDespesa_NormalizandoCompetencia()
    {
        var cmd = new CriarDespesaFixaCommand(
            new DateTime(2026, 6, 17), CategoriaDespesaFixa.Aluguel, "Loja", 3500m, null, new DateTime(2026, 6, 17));

        var dto = await _handler.Handle(cmd, CancellationToken.None);

        dto.Categoria.Should().Be(CategoriaDespesaFixa.Aluguel);
        dto.Valor.Should().Be(3500m);
        dto.Competencia.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<DespesaFixa>(), default), Times.Once);
        _repo.Verify(r => r.SalvarAsync(default), Times.Once);
    }
}
