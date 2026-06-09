using CasaDiAna.Application.FechamentoMensal.Dtos;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;

public record ObterFechamentoMensalQuery(DateTime Competencia) : IRequest<FechamentoMensalDto>;
