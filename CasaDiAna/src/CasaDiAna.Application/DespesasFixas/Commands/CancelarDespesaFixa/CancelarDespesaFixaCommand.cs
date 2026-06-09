using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.CancelarDespesaFixa;

public record CancelarDespesaFixaCommand(Guid Id) : IRequest;
