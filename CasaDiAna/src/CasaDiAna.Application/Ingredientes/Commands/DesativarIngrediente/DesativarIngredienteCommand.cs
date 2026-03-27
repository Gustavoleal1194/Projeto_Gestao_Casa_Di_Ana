using MediatR;

namespace CasaDiAna.Application.Ingredientes.Commands.DesativarIngrediente;

public record DesativarIngredienteCommand(Guid Id) : IRequest;
