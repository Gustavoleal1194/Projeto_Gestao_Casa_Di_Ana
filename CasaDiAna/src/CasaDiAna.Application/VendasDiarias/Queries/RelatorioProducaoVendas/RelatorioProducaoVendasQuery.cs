using CasaDiAna.Application.VendasDiarias.Dtos;
using MediatR;

namespace CasaDiAna.Application.VendasDiarias.Queries.RelatorioProducaoVendas;

public record RelatorioProducaoVendasQuery(
    DateTime De,
    DateTime Ate,
    Guid? ProdutoId = null) : IRequest<RelatorioProducaoVendasDto>;
