using CasaDiAna.Application.Categorias.Dtos;
using MediatR;

namespace CasaDiAna.Application.Categorias.Queries.ListarCategorias;

public record ListarCategoriasQuery(bool ApenasAtivos = true) : IRequest<IReadOnlyList<CategoriaDto>>;
