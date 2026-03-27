namespace CasaDiAna.Application.Entradas.Dtos;

public record ItemEntradaDto(
    Guid Id,
    Guid IngredienteId,
    string IngredienteNome,
    string UnidadeMedidaCodigo,
    decimal Quantidade,
    decimal CustoUnitario,
    decimal CustoTotal);
