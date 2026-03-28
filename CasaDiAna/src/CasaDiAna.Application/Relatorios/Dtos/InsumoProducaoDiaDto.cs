namespace CasaDiAna.Application.Relatorios.Dtos;

public record InsumoProducaoDiaDto(
    DateOnly Data,
    Guid ProducaoDiariaId,
    Guid ProdutoId,
    string ProdutoNome,
    Guid IngredienteId,
    string IngredienteNome,
    string UnidadeMedidaCodigo,
    decimal Quantidade);
