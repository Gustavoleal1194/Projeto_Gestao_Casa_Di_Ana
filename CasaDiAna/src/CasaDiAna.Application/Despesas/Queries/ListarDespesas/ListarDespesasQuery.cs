using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Despesas.Queries.ListarDespesas;

public record ListarDespesasQuery(DateTime Competencia, TipoDespesa? Tipo) : IRequest<DespesasMesDto>;
