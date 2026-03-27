using MediatR;

namespace CasaDiAna.Application.Categorias.Commands.DesativarCategoria;

public record DesativarCategoriaCommand(Guid Id) : IRequest;
