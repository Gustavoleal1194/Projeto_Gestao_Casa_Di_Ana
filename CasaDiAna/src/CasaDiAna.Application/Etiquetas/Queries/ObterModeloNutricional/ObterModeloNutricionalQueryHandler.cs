using CasaDiAna.Application.Etiquetas.Commands.SalvarModeloNutricional;
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Queries.ObterModeloNutricional;

public class ObterModeloNutricionalQueryHandler
    : IRequestHandler<ObterModeloNutricionalQuery, ModeloEtiquetaNutricionalDto?>
{
    private readonly IModeloEtiquetaNutricionalRepository _modelos;

    public ObterModeloNutricionalQueryHandler(IModeloEtiquetaNutricionalRepository modelos)
        => _modelos = modelos;

    public async Task<ModeloEtiquetaNutricionalDto?> Handle(
        ObterModeloNutricionalQuery request,
        CancellationToken cancellationToken)
    {
        var modelo = await _modelos.ObterPorProdutoIdAsync(request.ProdutoId, cancellationToken);
        return modelo is null ? null : SalvarModeloNutricionalCommandHandler.ToDto(modelo);
    }
}
