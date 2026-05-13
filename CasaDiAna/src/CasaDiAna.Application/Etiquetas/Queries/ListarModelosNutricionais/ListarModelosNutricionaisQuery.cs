using CasaDiAna.Application.Etiquetas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Queries.ListarModelosNutricionais;

public record ListarModelosNutricionaisQuery : IRequest<IReadOnlyList<ModeloNutricionalResumoDto>>;
