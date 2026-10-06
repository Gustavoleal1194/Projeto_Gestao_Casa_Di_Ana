using CasaDiAna.Application.Utensilios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Queries.ListarUtensilios;

public record ListarUtensiliosQuery(bool ApenasAtivos = true) : IRequest<IReadOnlyList<UtensilioResumoDto>>;
