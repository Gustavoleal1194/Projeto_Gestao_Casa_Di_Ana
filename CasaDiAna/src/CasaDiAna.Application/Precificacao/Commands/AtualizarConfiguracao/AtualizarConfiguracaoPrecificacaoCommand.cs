using CasaDiAna.Application.Precificacao.Dtos;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;

public record AtualizarConfiguracaoPrecificacaoCommand(
    decimal CmvAlvo, decimal MargemDesejada, decimal Taxas) : IRequest<ConfiguracaoPrecificacaoDto>;
