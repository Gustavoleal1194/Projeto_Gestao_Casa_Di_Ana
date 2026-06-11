using CasaDiAna.Application.Common;
using CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Precificacao;

public class ConfiguracaoPrecificacaoHandlersTests
{
    private readonly Mock<IConfiguracaoPrecificacaoRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public ConfiguracaoPrecificacaoHandlersTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    [Fact]
    public async Task Obter_DeveCriarPadrao_QuandoNaoExiste()
    {
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoPrecificacao?)null);
        var handler = new ObterConfiguracaoPrecificacaoQueryHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new ObterConfiguracaoPrecificacaoQuery(), CancellationToken.None);

        dto.CmvAlvo.Should().Be(0.30m);
        dto.MargemDesejada.Should().Be(0.20m);
        dto.Taxas.Should().Be(0m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoPrecificacao>(), default), Times.Once);
    }

    [Fact]
    public async Task Atualizar_DeveAlterar_QuandoJaExiste()
    {
        var existente = ConfiguracaoPrecificacao.Padrao(Guid.NewGuid());
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync(existente);
        var handler = new AtualizarConfiguracaoPrecificacaoCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(
            new AtualizarConfiguracaoPrecificacaoCommand(0.35m, 0.25m, 0.05m), CancellationToken.None);

        dto.CmvAlvo.Should().Be(0.35m);
        dto.MargemDesejada.Should().Be(0.25m);
        dto.Taxas.Should().Be(0.05m);
        _repo.Verify(r => r.Atualizar(existente), Times.Once);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoPrecificacao>(), default), Times.Never);
    }
}
