namespace CasaDiAna.Application.Inventarios.Dtos;

public record ItemInventarioDto(
    Guid Id,
    Guid IngredienteId,
    string IngredienteNome,
    string UnidadeMedidaCodigo,
    decimal QuantidadeSistema,
    decimal QuantidadeContada,
    decimal Diferenca,
    string? Observacoes);
