using CasaDiAna.Application.Etiquetas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.SalvarModeloNutricional;

public record SalvarModeloNutricionalCommand(
    Guid ProdutoId,
    string Porcao,
    decimal ValorEnergeticoKcal,
    decimal ValorEnergeticoKJ,
    decimal Carboidratos,
    decimal AcucaresTotais,
    decimal AcucaresAdicionados,
    decimal Proteinas,
    decimal GordurasTotais,
    decimal GordurasSaturadas,
    decimal GordurasTrans,
    decimal FibraAlimentar,
    decimal Sodio,
    int? PorcoesPorEmbalagem,
    string? MedidaCaseira,
    string? VdValorEnergetico,
    string? VdCarboidratos,
    string? VdAcucaresAdicionados,
    string? VdProteinas,
    string? VdGordurasTotais,
    string? VdGordurasSaturadas,
    string? VdGordurasTrans,
    string? VdFibraAlimentar,
    string? VdSodio,
    string? Nome) : IRequest<ModeloEtiquetaNutricionalDto>;
