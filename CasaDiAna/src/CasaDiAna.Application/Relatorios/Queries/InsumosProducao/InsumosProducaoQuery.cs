using CasaDiAna.Application.Relatorios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.InsumosProducao;

public record InsumosProducaoQuery(
    DateTime De,
    DateTime Ate,
    Guid? IngredienteId = null,
    Guid? ProdutoId = null) : IRequest<IReadOnlyList<InsumoProducaoDiaDto>>;
