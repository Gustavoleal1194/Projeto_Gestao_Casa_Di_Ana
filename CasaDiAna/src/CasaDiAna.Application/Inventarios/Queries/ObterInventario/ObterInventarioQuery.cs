using CasaDiAna.Application.Inventarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Queries.ObterInventario;

public record ObterInventarioQuery(Guid Id) : IRequest<InventarioDto>;
