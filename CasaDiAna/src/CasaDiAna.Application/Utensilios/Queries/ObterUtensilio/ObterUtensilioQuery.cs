using CasaDiAna.Application.Utensilios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Queries.ObterUtensilio;

public record ObterUtensilioQuery(Guid Id) : IRequest<UtensilioDto>;
