using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.AtualizarCategoriaUtensilio;

public record AtualizarCategoriaUtensilioCommand(Guid Id, string Nome) : IRequest<CategoriaUtensilioDto>;
