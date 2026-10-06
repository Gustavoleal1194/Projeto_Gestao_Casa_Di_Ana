using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.DesativarUtensilio;

public record DesativarUtensilioCommand(Guid Id) : IRequest;
