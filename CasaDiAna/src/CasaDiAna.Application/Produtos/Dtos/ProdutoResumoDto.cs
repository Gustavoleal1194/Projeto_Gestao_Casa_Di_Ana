namespace CasaDiAna.Application.Produtos.Dtos;

public record ProdutoResumoDto(
    Guid Id,
    string Nome,
    string? CategoriaNome,
    decimal PrecoVenda,
    bool Ativo);
