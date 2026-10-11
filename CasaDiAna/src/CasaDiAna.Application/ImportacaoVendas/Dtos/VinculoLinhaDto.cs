namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

/// <summary>Produto em que uma linha do relatório vira venda (decisão do usuário).</summary>
public record VinculoLinhaDto(string NomeRelatorio, Guid ProdutoId);
