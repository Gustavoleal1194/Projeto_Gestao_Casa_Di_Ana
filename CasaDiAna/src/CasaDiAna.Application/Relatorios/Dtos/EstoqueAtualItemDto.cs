namespace CasaDiAna.Application.Relatorios.Dtos;

public record EstoqueAtualItemDto(
    Guid IngredienteId,
    string Nome,
    string? CategoriaNome,
    string UnidadeMedidaCodigo,
    decimal EstoqueAtual,
    decimal EstoqueMinimo,
    decimal? EstoqueMaximo,
    bool EstaBaixoDoMinimo);
