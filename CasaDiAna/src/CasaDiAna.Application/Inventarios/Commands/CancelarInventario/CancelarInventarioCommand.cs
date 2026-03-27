using CasaDiAna.Application.Inventarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Commands.CancelarInventario;

public record CancelarInventarioCommand(Guid InventarioId) : IRequest<InventarioDto>;
