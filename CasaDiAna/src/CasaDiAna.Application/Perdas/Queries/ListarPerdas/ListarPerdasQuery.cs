using CasaDiAna.Application.Perdas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Perdas.Queries.ListarPerdas;

public record ListarPerdasQuery(
    DateTime? De = null,
    DateTime? Ate = null,
    Guid? ProdutoId = null) : IRequest<IReadOnlyList<PerdaProdutoDto>>;
