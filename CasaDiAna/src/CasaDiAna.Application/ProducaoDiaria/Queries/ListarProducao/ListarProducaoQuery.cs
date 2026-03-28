using CasaDiAna.Application.ProducaoDiaria.Dtos;
using MediatR;

namespace CasaDiAna.Application.ProducaoDiaria.Queries.ListarProducao;

public record ListarProducaoQuery(
    DateTime? De = null,
    DateTime? Ate = null,
    Guid? ProdutoId = null) : IRequest<IReadOnlyList<ProducaoDiariaDto>>;
