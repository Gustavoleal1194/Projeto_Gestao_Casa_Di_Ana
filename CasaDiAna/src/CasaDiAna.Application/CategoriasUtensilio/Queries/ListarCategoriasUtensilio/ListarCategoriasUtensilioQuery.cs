using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Queries.ListarCategoriasUtensilio;

public record ListarCategoriasUtensilioQuery(bool ApenasAtivos = true) : IRequest<IReadOnlyList<CategoriaUtensilioDto>>;
