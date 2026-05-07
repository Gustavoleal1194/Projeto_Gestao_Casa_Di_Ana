namespace CasaDiAna.Application.Ingredientes.Dtos;

public record IngredienteDto(
    Guid Id,
    string Nome,
    string? CodigoInterno,
    Guid? CategoriaId,
    string? CategoriaNome,
    short UnidadeMedidaId,
    string UnidadeMedidaCodigo,
    decimal EstoqueAtual,
    decimal EstoqueMinimo,
    decimal? EstoqueMaximo,
    bool EstaBaixoDoMinimo,
    string? Observacoes,
    string? QuantidadeEmbalagem,
    bool Ativo,
    DateTime AtualizadoEm);
