using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class DefinirFaturamentoManualCommandHandlerTests
{
    private readonly Mock<IFaturamentoMensalRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();
    private readonly DefinirFaturamentoManualCommandHandler _handler;

    public DefinirFaturamentoManualCommandHandlerTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
        _handler = new DefinirFaturamentoManualCommandHandler(_repo.Object, _user.Object);
    }

    [Fact]
    public async Task DeveCriar_QuandoNaoExiste()
    {
        _repo.Setup(r => r.ObterPorCompetenciaAsync(It.IsAny<DateTime>(), default))
             .ReturnsAsync((FaturamentoMensal?)null);
        _repo.Setup(r => r.AdicionarAsync(It.IsAny<FaturamentoMensal>(), default)).Returns(Task.CompletedTask);

        var dto = await _handler.Handle(
            new DefinirFaturamentoManualCommand(new DateTime(2026, 6, 1), 50000m), CancellationToken.None);

        dto.ValorManual.Should().Be(50000m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<FaturamentoMensal>(), default), Times.Once);
    }

    [Fact]
    public async Task DeveAtualizar_QuandoJaExiste()
    {
        var existente = FaturamentoMensal.Criar(new DateTime(2026, 6, 1), 40000m, Guid.NewGuid());
        _repo.Setup(r => r.ObterPorCompetenciaAsync(It.IsAny<DateTime>(), default)).ReturnsAsync(existente);

        var dto = await _handler.Handle(
            new DefinirFaturamentoManualCommand(new DateTime(2026, 6, 1), 60000m), CancellationToken.None);

        dto.ValorManual.Should().Be(60000m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<FaturamentoMensal>(), default), Times.Never);
    }
}
