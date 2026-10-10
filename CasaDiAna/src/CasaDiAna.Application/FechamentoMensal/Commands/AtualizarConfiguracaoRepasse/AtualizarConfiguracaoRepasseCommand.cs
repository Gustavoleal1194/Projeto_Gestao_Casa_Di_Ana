using CasaDiAna.Application.FechamentoMensal.Dtos;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Commands.AtualizarConfiguracaoRepasse;

public record AtualizarConfiguracaoRepasseCommand(
    decimal PercentualRetencaoCasa, decimal PercentualTaxaCartao) : IRequest<ConfiguracaoRepasseDto>;
