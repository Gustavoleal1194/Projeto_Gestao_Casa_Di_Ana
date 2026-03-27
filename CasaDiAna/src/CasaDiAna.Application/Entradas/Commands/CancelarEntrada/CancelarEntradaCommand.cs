using CasaDiAna.Application.Entradas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.CancelarEntrada;

public record CancelarEntradaCommand(Guid EntradaId) : IRequest<EntradaMercadoriaDto>;
