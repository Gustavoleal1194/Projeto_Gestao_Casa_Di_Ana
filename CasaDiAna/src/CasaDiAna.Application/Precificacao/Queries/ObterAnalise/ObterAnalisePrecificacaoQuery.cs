using CasaDiAna.Application.Precificacao.Dtos;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Queries.ObterAnalise;

public record ObterAnalisePrecificacaoQuery(DateTime Competencia) : IRequest<AnalisePrecificacaoDto>;
