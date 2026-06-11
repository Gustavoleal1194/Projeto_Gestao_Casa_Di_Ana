using CasaDiAna.Application.Common;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;

public class AtualizarConfiguracaoPrecificacaoCommandHandler
    : IRequestHandler<AtualizarConfiguracaoPrecificacaoCommand, ConfiguracaoPrecificacaoDto>
{
    private readonly IConfiguracaoPrecificacaoRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public AtualizarConfiguracaoPrecificacaoCommandHandler(
        IConfiguracaoPrecificacaoRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<ConfiguracaoPrecificacaoDto> Handle(
        AtualizarConfiguracaoPrecificacaoCommand request, CancellationToken cancellationToken)
    {
        var config = await _repo.ObterAsync(cancellationToken);
        if (config is null)
        {
            config = ConfiguracaoPrecificacao.Padrao(_currentUser.UsuarioId);
            config.Atualizar(request.CmvAlvo, request.MargemDesejada, request.Taxas, _currentUser.UsuarioId);
            await _repo.AdicionarAsync(config, cancellationToken);
        }
        else
        {
            config.Atualizar(request.CmvAlvo, request.MargemDesejada, request.Taxas, _currentUser.UsuarioId);
            _repo.Atualizar(config);
        }
        await _repo.SalvarAsync(cancellationToken);
        return ObterConfiguracaoPrecificacaoQueryHandler.ToDto(config);
    }
}
