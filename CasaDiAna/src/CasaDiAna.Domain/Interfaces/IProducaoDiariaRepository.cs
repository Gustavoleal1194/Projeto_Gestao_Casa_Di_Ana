using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IProducaoDiariaRepository
{
    Task<ProducaoDiaria?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<ProducaoDiaria>> ListarAsync(
        DateTime? de = null,
        DateTime? ate = null,
        Guid? produtoId = null,
        CancellationToken ct = default);
    Task AdicionarAsync(ProducaoDiaria producao, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
