namespace CasaDiAna.Application.Ingredientes.Dtos;

public record IngredienteResumoDto(
    Guid Id,
    string Nome,
    string? CodigoInterno,
    string? CategoriaNome,
    string UnidadeMedidaCodigo,
    decimal EstoqueAtual,
    decimal EstoqueMinimo,
    bool EstaBaixoDoMinimo,
    bool Ativo);
