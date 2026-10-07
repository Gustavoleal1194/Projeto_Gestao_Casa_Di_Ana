using CasaDiAna.Application.Entradas.Queries.ListarEntradas;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Entradas;

public class ListarEntradasQueryHandlerTests
{
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly ListarEntradasQueryHandler _handler;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public ListarEntradasQueryHandlerTests()
    {
        _handler = new ListarEntradasQueryHandler(_entradas.Object);
    }

    [Fact]
    public async Task DeveRetornarProximoVencimentoNulo_QuandoEntradaSemBoleto()
    {
        var fornecedorId = Guid.NewGuid();
        var entrada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entrada.AdicionarItem(Guid.NewGuid(), 10, 5m);

        _entradas.Setup(r => r.ListarAsync(null, null, default))
            .ReturnsAsync(new List<EntradaMercadoria> { entrada });

        var resultado = await _handler.Handle(new ListarEntradasQuery(), CancellationToken.None);

        resultado.Should().HaveCount(1);
        resultado[0].ProximoVencimentoBoleto.Should().BeNull();
        resultado[0].TotalBoletos.Should().Be(0);
    }

    [Fact]
    public async Task DeveRetornarProximoVencimento_QuandoEntradaComUmBoleto()
    {
        var fornecedorId = Guid.NewGuid();
        var vencimento = DateTime.UtcNow.Date.AddDays(15);
        var entrada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entrada.AdicionarItem(Guid.NewGuid(), 10, 5m);
        entrada.AdicionarBoleto(vencimento);

        _entradas.Setup(r => r.ListarAsync(null, null, default))
            .ReturnsAsync(new List<EntradaMercadoria> { entrada });

        var resultado = await _handler.Handle(new ListarEntradasQuery(), CancellationToken.None);

        resultado.Should().HaveCount(1);
        resultado[0].ProximoVencimentoBoleto.Should().Be(vencimento);
        resultado[0].TotalBoletos.Should().Be(1);
    }

    [Fact]
    public async Task DeveRetornarMenorVencimento_QuandoBoletosAdicionadosForaDeOrdem()
    {
        var fornecedorId = Guid.NewGuid();
        var vencimentoDistante = DateTime.UtcNow.Date.AddDays(60);
        var vencimentoProximo = DateTime.UtcNow.Date.AddDays(5);
        var entrada = EntradaMercadoria.Criar(fornecedorId, DateTime.UtcNow, _usuarioId);
        entrada.AdicionarItem(Guid.NewGuid(), 10, 5m);
        entrada.AdicionarBoleto(vencimentoDistante);
        entrada.AdicionarBoleto(vencimentoProximo);

        _entradas.Setup(r => r.ListarAsync(null, null, default))
            .ReturnsAsync(new List<EntradaMercadoria> { entrada });

        var resultado = await _handler.Handle(new ListarEntradasQuery(), CancellationToken.None);

        resultado.Should().HaveCount(1);
        resultado[0].ProximoVencimentoBoleto.Should().Be(vencimentoProximo);
        resultado[0].TotalBoletos.Should().Be(2);
    }
}
