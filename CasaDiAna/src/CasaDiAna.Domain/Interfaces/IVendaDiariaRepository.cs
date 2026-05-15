using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IVendaDiariaRepository
{
    Task<VendaDiaria?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<VendaDiaria>> ListarAsync(
        DateTime? de = null,
        DateTime? ate = null,
        IReadOnlyList<Guid>? produtoIds = null,
        CancellationToken ct = default);
    Task AdicionarAsync(VendaDiaria venda, CancellationToken ct = default);
    Task AdicionarRangeAsync(IEnumerable<VendaDiaria> vendas, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
