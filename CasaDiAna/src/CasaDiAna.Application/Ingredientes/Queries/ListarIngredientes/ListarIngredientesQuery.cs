using CasaDiAna.Application.Ingredientes.Dtos;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Queries.ListarIngredientes;

public record ListarIngredientesQuery(bool ApenasAtivos = true) : IRequest<IReadOnlyList<IngredienteResumoDto>>;
