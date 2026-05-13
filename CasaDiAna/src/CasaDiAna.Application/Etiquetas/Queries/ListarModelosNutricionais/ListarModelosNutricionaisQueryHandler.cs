using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Queries.ListarModelosNutricionais;

public class ListarModelosNutricionaisQueryHandler
    : IRequestHandler<ListarModelosNutricionaisQuery, IReadOnlyList<ModeloNutricionalResumoDto>>
{
    private readonly IModeloEtiquetaNutricionalRepository _modelos;

    public ListarModelosNutricionaisQueryHandler(IModeloEtiquetaNutricionalRepository modelos)
        => _modelos = modelos;

    public async Task<IReadOnlyList<ModeloNutricionalResumoDto>> Handle(
        ListarModelosNutricionaisQuery request,
        CancellationToken cancellationToken)
    {
        var modelos = await _modelos.ListarTodosAsync(cancellationToken);
        return modelos
            .Select(m => new ModeloNutricionalResumoDto(
                m.Id,
                m.ProdutoId,
                m.Produto?.Nome ?? "(sem nome)",
                m.Porcao,
                m.ValorEnergeticoKcal,
                m.ValorEnergeticoKJ,
                m.Carboidratos,
                m.AcucaresTotais,
                m.AcucaresAdicionados,
                m.Proteinas,
                m.GordurasTotais,
                m.GordurasSaturadas,
                m.GordurasTrans,
                m.FibraAlimentar,
                m.Sodio,
                m.PorcoesPorEmbalagem,
                m.MedidaCaseira,
                m.VdValorEnergetico,
                m.VdCarboidratos,
                m.VdAcucaresAdicionados,
                m.VdProteinas,
                m.VdGordurasTotais,
                m.VdGordurasSaturadas,
                m.VdGordurasTrans,
                m.VdFibraAlimentar,
                m.VdSodio))
            .ToList();
    }
}
