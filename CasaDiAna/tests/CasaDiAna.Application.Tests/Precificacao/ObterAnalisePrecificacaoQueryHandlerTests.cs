using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Application.Precificacao.Queries.ObterAnalise;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using MediatR;
using Moq;

namespace CasaDiAna.Application.Tests.Precificacao;

public class ObterAnalisePrecificacaoQueryHandlerTests
{
    [Fact]
    public async Task DeveMontarInsumos_ComCustoEPercentualDoFechamento()
    {
        var comp = new DateTime(2026, 6, 1);

        // Produto de revenda: custo unitário direto = 4, preço 10, sem categoria
        var produto = Produto.Criar("Refrigerante", 10m, Guid.NewGuid(), tipo: TipoProduto.Revenda);
        produto.DefinirCustoUnitario(4m);

        var produtos = new Mock<IProdutoRepository>();
        produtos.Setup(r => r.ListarComFichaAsync(true, default))
                .ReturnsAsync(new List<Produto> { produto });

        var mediator = new Mock<IMediator>();
        mediator.Setup(m => m.Send(It.IsAny<ObterFechamentoMensalQuery>(), default))
                .ReturnsAsync(new FechamentoMensalDto(
                    comp, 0m, null, 0m, 0m, 0m, 0m, 0.5m, 0m, 0m, 0m,
                    new List<TotalCategoriaDto>()));
        mediator.Setup(m => m.Send(It.IsAny<ObterConfiguracaoPrecificacaoQuery>(), default))
                .ReturnsAsync(new ConfiguracaoPrecificacaoDto(0.30m, 0.20m, 0m));

        var handler = new ObterAnalisePrecificacaoQueryHandler(produtos.Object, mediator.Object);

        var dto = await handler.Handle(new ObterAnalisePrecificacaoQuery(comp), CancellationToken.None);

        dto.DespesaFixaPercentual.Should().Be(0.5m);
        dto.Config.CmvAlvo.Should().Be(0.30m);
        dto.Produtos.Should().ContainSingle();
        var p = dto.Produtos[0];
        p.PrecoVenda.Should().Be(10m);
        p.CustoDireto.Should().Be(4m);
        p.TemFicha.Should().BeTrue();
        p.CategoriaNome.Should().BeNull();
    }
}
