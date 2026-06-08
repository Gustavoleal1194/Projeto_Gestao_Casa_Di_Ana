using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.Produtos.Dtos;

public record FichaTecnicaDto(
    Guid ProdutoId,
    string ProdutoNome,
    decimal PrecoVenda,
    IReadOnlyList<ItemFichaTecnicaDto> Itens,
    decimal CustoTotal,
    decimal? MargemLucro,
    TipoProduto Tipo,
    decimal? CustoUnitario);
