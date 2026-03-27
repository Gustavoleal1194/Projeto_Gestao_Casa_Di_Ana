using CasaDiAna.Application.Categorias.Dtos;
using MediatR;

namespace CasaDiAna.Application.Categorias.Commands.AtualizarCategoria;

public record AtualizarCategoriaCommand(Guid Id, string Nome) : IRequest<CategoriaDto>;
