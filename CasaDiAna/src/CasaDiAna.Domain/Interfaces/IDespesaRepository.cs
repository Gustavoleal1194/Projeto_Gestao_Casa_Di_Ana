using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IDespesaRepository
{
    Task<Despesa?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Despesa>> ListarPorCompetenciaAsync(DateTime competencia, CancellationToken ct = default);
    Task AdicionarAsync(Despesa despesa, CancellationToken ct = default);
    void Atualizar(Despesa despesa);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
