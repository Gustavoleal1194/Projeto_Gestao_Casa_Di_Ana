using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IEntradaMercadoriaRepository
{
    Task<EntradaMercadoria?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<EntradaMercadoria>> ListarAsync(DateTime? de = null, DateTime? ate = null, CancellationToken ct = default);
    Task AdicionarAsync(EntradaMercadoria entrada, CancellationToken ct = default);
    void Atualizar(EntradaMercadoria entrada);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
