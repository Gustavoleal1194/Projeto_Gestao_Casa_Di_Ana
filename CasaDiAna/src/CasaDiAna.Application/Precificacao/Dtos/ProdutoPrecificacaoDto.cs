namespace CasaDiAna.Application.Precificacao.Dtos;

public record ProdutoPrecificacaoDto(
    Guid Id,
    string Nome,
    string? CategoriaNome,
    decimal PrecoVenda,
    decimal CustoDireto,
    bool TemFicha);
