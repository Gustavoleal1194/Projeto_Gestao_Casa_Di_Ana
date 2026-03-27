using CasaDiAna.Application.Inventarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Queries.ListarInventarios;

public record ListarInventariosQuery : IRequest<IReadOnlyList<InventarioResumoDto>>;
