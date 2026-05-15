using CasaDiAna.Application.VendasDiarias.Dtos;
using MediatR;

namespace CasaDiAna.Application.VendasDiarias.Queries.ListarVendas;

public record ListarVendasQuery(
    DateTime? De = null,
    DateTime? Ate = null,
    IReadOnlyList<Guid>? ProdutoIds = null) : IRequest<IReadOnlyList<VendaDiariaDto>>;
