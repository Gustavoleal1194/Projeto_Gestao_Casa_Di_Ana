using CasaDiAna.Application.Relatorios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.InsumosProducao;

public record InsumosProducaoQuery(
    DateTime De,
    DateTime Ate,
    IReadOnlyList<Guid>? IngredienteIds = null,
    IReadOnlyList<Guid>? ProdutoIds = null) : IRequest<IReadOnlyList<InsumoProducaoDiaDto>>;
