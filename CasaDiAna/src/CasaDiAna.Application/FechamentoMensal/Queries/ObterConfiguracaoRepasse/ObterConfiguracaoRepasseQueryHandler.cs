using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Queries.ObterConfiguracaoRepasse;

public class ObterConfiguracaoRepasseQueryHandler
    : IRequestHandler<ObterConfiguracaoRepasseQuery, ConfiguracaoRepasseDto>
{
    private readonly IConfiguracaoRepasseRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public ObterConfiguracaoRepasseQueryHandler(
        IConfiguracaoRepasseRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<ConfiguracaoRepasseDto> Handle(
        ObterConfiguracaoRepasseQuery request, CancellationToken cancellationToken)
    {
        var config = await _repo.ObterAsync(cancellationToken);
        if (config is null)
        {
            config = ConfiguracaoRepasse.Padrao(_currentUser.UsuarioId);
            await _repo.AdicionarAsync(config, cancellationToken);
            await _repo.SalvarAsync(cancellationToken);
        }
        return ToDto(config);
    }

    internal static ConfiguracaoRepasseDto ToDto(ConfiguracaoRepasse c) =>
        new(c.PercentualRetencaoCasa, c.PercentualTaxaCartao);
}
