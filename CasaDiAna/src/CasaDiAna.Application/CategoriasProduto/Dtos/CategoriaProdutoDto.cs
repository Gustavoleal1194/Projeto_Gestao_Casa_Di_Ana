namespace CasaDiAna.Application.CategoriasProduto.Dtos;

public record CategoriaProdutoDto(
    Guid Id,
    string Nome,
    bool Ativo,
    DateTime AtualizadoEm);
