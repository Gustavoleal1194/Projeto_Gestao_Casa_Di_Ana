using CasaDiAna.Application.UnidadesMedida.Dtos;
using MediatR;

namespace CasaDiAna.Application.UnidadesMedida.Queries.ListarUnidadesMedida;

public record ListarUnidadesMedidaQuery : IRequest<IReadOnlyList<UnidadeMedidaDto>>;
