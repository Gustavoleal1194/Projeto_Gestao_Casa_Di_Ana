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
    decimal Proteinas,
    decimal GordurasTotais,
    decimal GordurasSaturadas,
    decimal FibraAlimentar,
    decimal Sodio) : IRequest<ModeloEtiquetaNutricionalDto>;
