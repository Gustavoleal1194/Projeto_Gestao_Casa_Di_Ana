using CasaDiAna.Application.Entradas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Entradas.Queries.ListarEntradas;

public record ListarEntradasQuery(
    DateTime? De = null,
    DateTime? Ate = null) : IRequest<IReadOnlyList<EntradaMercadoriaResumoDto>>;
