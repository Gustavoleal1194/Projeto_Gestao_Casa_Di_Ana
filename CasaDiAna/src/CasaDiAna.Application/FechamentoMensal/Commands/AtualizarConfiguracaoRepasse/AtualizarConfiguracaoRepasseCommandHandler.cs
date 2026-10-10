using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterConfiguracaoRepasse;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Commands.AtualizarConfiguracaoRepasse;

public class AtualizarConfiguracaoRepasseCommandHandler
    : IRequestHandler<AtualizarConfiguracaoRepasseCommand, ConfiguracaoRepasseDto>
{
    private readonly IConfiguracaoRepasseRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public AtualizarConfiguracaoRepasseCommandHandler(
        IConfiguracaoRepasseRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<ConfiguracaoRepasseDto> Handle(
        AtualizarConfiguracaoRepasseCommand request, CancellationToken cancellationToken)
    {
        var config = await _repo.ObterAsync(cancellationToken);
        if (config is null)
        {
            config = ConfiguracaoRepasse.Padrao(_currentUser.UsuarioId);
            config.Atualizar(request.PercentualRetencaoCasa, request.PercentualTaxaCartao, _currentUser.UsuarioId);
            await _repo.AdicionarAsync(config, cancellationToken);
        }
        else
        {
            config.Atualizar(request.PercentualRetencaoCasa, request.PercentualTaxaCartao, _currentUser.UsuarioId);
            _repo.Atualizar(config);
        }
        await _repo.SalvarAsync(cancellationToken);
        return ObterConfiguracaoRepasseQueryHandler.ToDto(config);
    }
}
