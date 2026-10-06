using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.DesativarCategoriaUtensilio;

public record DesativarCategoriaUtensilioCommand(Guid Id) : IRequest;
