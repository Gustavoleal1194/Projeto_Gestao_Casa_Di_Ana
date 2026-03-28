namespace CasaDiAna.Application.Perdas.Dtos;

public record PerdaProdutoDto(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
    DateTime Data,
    decimal Quantidade,
    string Justificativa,
    DateTime CriadoEm);
