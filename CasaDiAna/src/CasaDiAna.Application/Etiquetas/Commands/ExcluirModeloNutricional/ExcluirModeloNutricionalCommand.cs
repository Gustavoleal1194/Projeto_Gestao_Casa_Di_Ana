using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.ExcluirModeloNutricional;

public record ExcluirModeloNutricionalCommand(Guid ProdutoId) : IRequest;
