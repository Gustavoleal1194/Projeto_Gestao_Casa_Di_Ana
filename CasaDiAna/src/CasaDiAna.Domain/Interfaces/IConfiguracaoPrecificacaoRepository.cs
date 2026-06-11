using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IConfiguracaoPrecificacaoRepository
{
    Task<ConfiguracaoPrecificacao?> ObterAsync(CancellationToken ct = default);
    Task AdicionarAsync(ConfiguracaoPrecificacao config, CancellationToken ct = default);
    void Atualizar(ConfiguracaoPrecificacao config);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
