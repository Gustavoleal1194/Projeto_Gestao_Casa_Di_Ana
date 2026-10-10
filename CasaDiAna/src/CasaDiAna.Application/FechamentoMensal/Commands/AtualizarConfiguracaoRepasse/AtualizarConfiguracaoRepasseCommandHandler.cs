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
        var existente = await _repo.ObterAsync(cancellationToken);
        var config = existente ?? ConfiguracaoRepasse.Padrao(_currentUser.UsuarioId);
        config.Atualizar(request.PercentualRetencaoCasa, request.PercentualTaxaCartao, _currentUser.UsuarioId);

        if (existente is null)
            await _repo.AdicionarAsync(config, cancellationToken);
        else
            _repo.Atualizar(config);

        await _repo.SalvarAsync(cancellationToken);
        return ObterConfiguracaoRepasseQueryHandler.ToDto(config);
    }
}
