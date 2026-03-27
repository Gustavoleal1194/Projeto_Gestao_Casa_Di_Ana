using CasaDiAna.Application.Inventarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Commands.FinalizarInventario;

public record FinalizarInventarioCommand(Guid InventarioId) : IRequest<InventarioDto>;
