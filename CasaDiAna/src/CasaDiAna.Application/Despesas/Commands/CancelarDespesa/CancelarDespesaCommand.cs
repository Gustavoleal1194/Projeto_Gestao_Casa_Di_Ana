using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CancelarDespesa;

public record CancelarDespesaCommand(Guid Id) : IRequest;
