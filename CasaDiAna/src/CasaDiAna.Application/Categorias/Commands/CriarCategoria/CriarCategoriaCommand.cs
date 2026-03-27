using CasaDiAna.Application.Categorias.Dtos;
using MediatR;

namespace CasaDiAna.Application.Categorias.Commands.CriarCategoria;

public record CriarCategoriaCommand(string Nome) : IRequest<CategoriaDto>;
