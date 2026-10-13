namespace CasaDiAna.Domain.Entities;

public sealed record AlteracaoBoletos(
    IReadOnlyList<BoletoEntrada> Removidos,
    IReadOnlyList<BoletoEntrada> Adicionados);
