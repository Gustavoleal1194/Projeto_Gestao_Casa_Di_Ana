using CasaDiAna.Application.DespesasFixas.Dtos;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Queries.ListarDespesasFixas;

public record ListarDespesasFixasQuery(DateTime Competencia) : IRequest<DespesasFixasMesDto>;
