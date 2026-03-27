namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public record ItemEntradaInputDto(
    Guid IngredienteId,
    decimal Quantidade,
    decimal CustoUnitario);
