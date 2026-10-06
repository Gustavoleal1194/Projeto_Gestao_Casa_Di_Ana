namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public record ItemEntradaUtensilioInputDto(
    Guid UtensilioId,
    decimal Quantidade,
    decimal CustoUnitario);
