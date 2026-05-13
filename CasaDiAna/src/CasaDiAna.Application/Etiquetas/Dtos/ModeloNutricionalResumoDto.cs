namespace CasaDiAna.Application.Etiquetas.Dtos;

public record ModeloNutricionalResumoDto(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
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
    string? MedidaCaseira);
