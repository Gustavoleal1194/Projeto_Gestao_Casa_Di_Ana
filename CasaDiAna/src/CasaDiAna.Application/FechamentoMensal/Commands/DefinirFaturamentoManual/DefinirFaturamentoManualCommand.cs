using CasaDiAna.Application.FechamentoMensal.Dtos;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;

public record DefinirFaturamentoManualCommand(DateTime Competencia, decimal? ValorManual)
    : IRequest<FaturamentoMensalDto>;
