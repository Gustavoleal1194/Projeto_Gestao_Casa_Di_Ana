namespace CasaDiAna.Application.Etiquetas.Dtos;

public record ModeloEtiquetaNutricionalDto(
    Guid Id,
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
    decimal Sodio);
