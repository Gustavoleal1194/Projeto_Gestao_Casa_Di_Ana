using CasaDiAna.Application.Ingredientes.Dtos;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Queries.ObterIngrediente;

public record ObterIngredienteQuery(Guid Id) : IRequest<IngredienteDto>;
