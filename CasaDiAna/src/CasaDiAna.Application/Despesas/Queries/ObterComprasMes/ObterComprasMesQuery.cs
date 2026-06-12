using CasaDiAna.Application.Despesas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Despesas.Queries.ObterComprasMes;

public record ObterComprasMesQuery(DateTime Competencia) : IRequest<ComprasMesDto>;
