using CasaDiAna.Application.Etiquetas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Queries.ListarHistorico;

public record ListarHistoricoQuery(Guid? ProdutoId = null)
    : IRequest<IReadOnlyList<HistoricoImpressaoDto>>;
