namespace CasaDiAna.Application.Produtos.Dtos;

public record ProdutoDto(
    Guid Id,
    string Nome,
    Guid? CategoriaProdutoId,
    string? CategoriaNome,
    string? Descricao,
    decimal PrecoVenda,
    int? DiasValidade,
    bool Ativo,
    DateTime AtualizadoEm);
