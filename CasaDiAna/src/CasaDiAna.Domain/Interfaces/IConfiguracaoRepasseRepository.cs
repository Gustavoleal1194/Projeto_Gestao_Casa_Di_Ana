using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IConfiguracaoRepasseRepository
{
    Task<ConfiguracaoRepasse?> ObterAsync(CancellationToken ct = default);
    Task AdicionarAsync(ConfiguracaoRepasse config, CancellationToken ct = default);
    void Atualizar(ConfiguracaoRepasse config);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
