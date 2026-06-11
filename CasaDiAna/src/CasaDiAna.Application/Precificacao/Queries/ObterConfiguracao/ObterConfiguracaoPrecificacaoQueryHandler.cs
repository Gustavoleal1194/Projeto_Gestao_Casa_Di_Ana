using CasaDiAna.Application.Common;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;

public class ObterConfiguracaoPrecificacaoQueryHandler
    : IRequestHandler<ObterConfiguracaoPrecificacaoQuery, ConfiguracaoPrecificacaoDto>
{
    private readonly IConfiguracaoPrecificacaoRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public ObterConfiguracaoPrecificacaoQueryHandler(
        IConfiguracaoPrecificacaoRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<ConfiguracaoPrecificacaoDto> Handle(
        ObterConfiguracaoPrecificacaoQuery request, CancellationToken cancellationToken)
    {
        var config = await _repo.ObterAsync(cancellationToken);
        if (config is null)
        {
            config = ConfiguracaoPrecificacao.Padrao(_currentUser.UsuarioId);
            await _repo.AdicionarAsync(config, cancellationToken);
            await _repo.SalvarAsync(cancellationToken);
        }
        return ToDto(config);
    }

    internal static ConfiguracaoPrecificacaoDto ToDto(ConfiguracaoPrecificacao c) =>
        new(c.CmvAlvo, c.MargemDesejada, c.Taxas);
}
