using CasaDiAna.Application.VendasDiarias.Dtos;
using MediatR;

namespace CasaDiAna.Application.VendasDiarias.Queries.RelatorioProducaoVendas;

public record RelatorioProducaoVendasQuery(
    DateTime De,
    DateTime Ate,
    IReadOnlyList<Guid>? ProdutoIds = null) : IRequest<RelatorioProducaoVendasDto>;
