namespace CasaDiAna.Application.Entradas.Dtos;

public record ItemEntradaUtensilioDto(
    Guid Id,
    Guid UtensilioId,
    string UtensilioNome,
    string UnidadeMedidaCodigo,
    decimal Quantidade,
    decimal CustoUnitario,
    decimal CustoTotal);
