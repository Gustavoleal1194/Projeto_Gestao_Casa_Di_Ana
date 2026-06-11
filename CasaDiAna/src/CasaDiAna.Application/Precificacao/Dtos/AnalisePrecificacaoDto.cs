namespace CasaDiAna.Application.Precificacao.Dtos;

public record AnalisePrecificacaoDto(
    DateTime Competencia,
    decimal? DespesaFixaPercentual,
    ConfiguracaoPrecificacaoDto Config,
    IReadOnlyList<ProdutoPrecificacaoDto> Produtos);
