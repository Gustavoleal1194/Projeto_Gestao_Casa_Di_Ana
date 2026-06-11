using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Queries.ObterAnalise;

public class ObterAnalisePrecificacaoQueryHandler
    : IRequestHandler<ObterAnalisePrecificacaoQuery, AnalisePrecificacaoDto>
{
    private readonly IProdutoRepository _produtos;
    private readonly IMediator _mediator;

    public ObterAnalisePrecificacaoQueryHandler(IProdutoRepository produtos, IMediator mediator)
    {
        _produtos = produtos;
        _mediator = mediator;
    }

    public async Task<AnalisePrecificacaoDto> Handle(
        ObterAnalisePrecificacaoQuery request, CancellationToken cancellationToken)
    {
        var competencia = DespesaFixa.NormalizarCompetencia(request.Competencia);

        var config = await _mediator.Send(new ObterConfiguracaoPrecificacaoQuery(), cancellationToken);
        var fechamento = await _mediator.Send(new ObterFechamentoMensalQuery(competencia), cancellationToken);

        var produtos = await _produtos.ListarComFichaAsync(apenasAtivos: true, cancellationToken);

        var itens = produtos.Select(p => new ProdutoPrecificacaoDto(
            p.Id,
            p.Nome,
            p.Categoria?.Nome,
            p.PrecoVenda,
            p.CalcularCustoFicha(),
            TemFicha: p.Tipo == TipoProduto.Revenda ? p.CustoUnitario != null : p.ItensFicha.Any()
        )).ToList();

        return new AnalisePrecificacaoDto(
            competencia,
            fechamento.DespesaFixaPercentual,
            config,
            itens);
    }
}
