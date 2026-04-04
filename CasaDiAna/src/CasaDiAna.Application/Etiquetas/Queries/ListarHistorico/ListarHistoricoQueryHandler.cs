using CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Queries.ListarHistorico;

public class ListarHistoricoQueryHandler
    : IRequestHandler<ListarHistoricoQuery, IReadOnlyList<HistoricoImpressaoDto>>
{
    private readonly IHistoricoImpressaoRepository _historico;

    public ListarHistoricoQueryHandler(IHistoricoImpressaoRepository historico)
        => _historico = historico;

    public async Task<IReadOnlyList<HistoricoImpressaoDto>> Handle(
        ListarHistoricoQuery request,
        CancellationToken cancellationToken)
    {
        var registros = await _historico.ListarAsync(request.ProdutoId, cancellationToken);
        return registros
            .Select(h => RegistrarImpressaoCommandHandler.ToDto(h, h.Produto?.Nome ?? ""))
            .ToList();
    }
}
