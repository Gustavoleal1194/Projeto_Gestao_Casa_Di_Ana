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
    IReadOnlyList<SugestaoMatchDto> Sugestoes,
    TipoRepasse? TipoRepasse = null);

public record SugestaoMatchDto(Guid ProdutoId, string ProdutoNome);
