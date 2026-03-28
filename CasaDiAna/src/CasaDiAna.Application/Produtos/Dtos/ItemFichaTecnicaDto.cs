namespace CasaDiAna.Application.Produtos.Dtos;

public record ItemFichaTecnicaDto(
    Guid IngredienteId,
    string IngredienteNome,
    string UnidadeMedidaCodigo,
    decimal QuantidadePorUnidade,
    decimal? CustoUnitario,
    decimal CustoItem);
