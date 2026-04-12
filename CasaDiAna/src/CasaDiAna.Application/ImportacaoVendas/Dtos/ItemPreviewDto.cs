namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public record ItemPreviewDto(
    string? CodigoExterno,
    string NomeRelatorio,
    string? Grupo,
    decimal Quantidade,
    decimal ValorTotal,
    StatusImportacao Status,
    Guid? ProdutoId,
    string? ProdutoNome,
    IReadOnlyList<SugestaoMatchDto> Sugestoes);

public record SugestaoMatchDto(Guid ProdutoId, string ProdutoNome);
