using CasaDiAna.Application.Precificacao.Dtos;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;

public record ObterConfiguracaoPrecificacaoQuery : IRequest<ConfiguracaoPrecificacaoDto>;
