using MediatR;

namespace CasaDiAna.Application.Ingredientes.Commands.AtualizarCustoIngrediente;

public record AtualizarCustoIngredienteCommand(Guid Id, decimal? CustoUnitario) : IRequest;
