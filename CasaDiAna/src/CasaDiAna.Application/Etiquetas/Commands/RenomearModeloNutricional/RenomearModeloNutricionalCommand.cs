using CasaDiAna.Application.Etiquetas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.RenomearModeloNutricional;

public record RenomearModeloNutricionalCommand(Guid ProdutoId, string? Nome) : IRequest<ModeloEtiquetaNutricionalDto>;
