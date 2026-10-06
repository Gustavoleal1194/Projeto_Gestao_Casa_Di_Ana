using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;

public record CriarCategoriaUtensilioCommand(string Nome) : IRequest<CategoriaUtensilioDto>;
