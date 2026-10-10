using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Commands.AtualizarConfiguracaoRepasse;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterConfiguracaoRepasse;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.FechamentoMensal;

public class ConfiguracaoRepasseHandlersTests
{
    private readonly Mock<IConfiguracaoRepasseRepository> _repo = new();
    private readonly Mock<ICurrentUserService> _user = new();

    public ConfiguracaoRepasseHandlersTests()
    {
        _user.Setup(u => u.UsuarioId).Returns(Guid.NewGuid());
        _repo.Setup(r => r.SalvarAsync(default)).ReturnsAsync(1);
    }

    [Fact]
    public async Task Obter_DeveCriarPadrao_QuandoNaoExiste()
    {
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);
        var handler = new ObterConfiguracaoRepasseQueryHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new ObterConfiguracaoRepasseQuery(), CancellationToken.None);

        dto.PercentualRetencaoCasa.Should().Be(0.25m);
        dto.PercentualTaxaCartao.Should().Be(0.03m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoRepasse>(), default), Times.Once);
    }

    [Fact]
    public async Task Atualizar_DeveAlterar_QuandoJaExiste()
    {
        var existente = ConfiguracaoRepasse.Padrao(Guid.NewGuid());
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync(existente);
        var handler = new AtualizarConfiguracaoRepasseCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new AtualizarConfiguracaoRepasseCommand(0.20m, 0.04m), CancellationToken.None);

        dto.PercentualRetencaoCasa.Should().Be(0.20m);
        dto.PercentualTaxaCartao.Should().Be(0.04m);
        _repo.Verify(r => r.Atualizar(existente), Times.Once);
    }

    [Fact]
    public async Task Atualizar_DeveCriar_QuandoNaoExiste()
    {
        _repo.Setup(r => r.ObterAsync(default)).ReturnsAsync((ConfiguracaoRepasse?)null);
        var handler = new AtualizarConfiguracaoRepasseCommandHandler(_repo.Object, _user.Object);

        var dto = await handler.Handle(new AtualizarConfiguracaoRepasseCommand(0.30m, 0.02m), CancellationToken.None);

        dto.PercentualRetencaoCasa.Should().Be(0.30m);
        _repo.Verify(r => r.AdicionarAsync(It.IsAny<ConfiguracaoRepasse>(), default), Times.Once);
    }

    [Theory]
    [InlineData(-0.01, 0.03)]
    [InlineData(1, 0)]
    [InlineData(0.25, 1)]
    [InlineData(0.6, 0.4)]
    public void Validator_DeveRejeitarPercentuaisInvalidos(double retencao, double cartao)
    {
        var resultado = new AtualizarConfiguracaoRepasseCommandValidator()
            .Validate(new AtualizarConfiguracaoRepasseCommand((decimal)retencao, (decimal)cartao));

        resultado.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validator_DeveAceitarPadrao() =>
        new AtualizarConfiguracaoRepasseCommandValidator()
            .Validate(new AtualizarConfiguracaoRepasseCommand(0.25m, 0.03m))
            .IsValid.Should().BeTrue();
}
