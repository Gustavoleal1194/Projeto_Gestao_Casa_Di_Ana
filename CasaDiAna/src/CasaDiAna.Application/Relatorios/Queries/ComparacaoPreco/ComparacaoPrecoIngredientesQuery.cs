using CasaDiAna.Application.Relatorios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.ComparacaoPreco;

public record ComparacaoPrecoIngredientesQuery(
    DateTime? De,
    DateTime? Ate,
    Guid? IngredienteId
) : IRequest<ComparacaoPrecoDto>;
