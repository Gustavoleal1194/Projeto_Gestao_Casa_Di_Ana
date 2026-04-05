using CasaDiAna.Application.Etiquetas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Queries.ObterModeloNutricional;

public record ObterModeloNutricionalQuery(Guid ProdutoId)
    : IRequest<ModeloEtiquetaNutricionalDto?>;
