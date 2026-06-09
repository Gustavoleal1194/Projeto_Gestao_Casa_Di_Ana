using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IDespesaFixaRepository
{
    Task<DespesaFixa?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<DespesaFixa>> ListarPorCompetenciaAsync(DateTime competencia, CancellationToken ct = default);
    Task AdicionarAsync(DespesaFixa despesa, CancellationToken ct = default);
    void Atualizar(DespesaFixa despesa);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
