using CasaDiAna.Application.FechamentoMensal.Dtos;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Queries.ObterConfiguracaoRepasse;

public record ObterConfiguracaoRepasseQuery : IRequest<ConfiguracaoRepasseDto>;
