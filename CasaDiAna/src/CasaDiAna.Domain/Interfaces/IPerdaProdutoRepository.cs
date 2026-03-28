using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IPerdaProdutoRepository
{
    Task<IReadOnlyList<PerdaProduto>> ListarAsync(
        DateTime? de = null,
        DateTime? ate = null,
        Guid? produtoId = null,
        CancellationToken ct = default);
    Task AdicionarAsync(PerdaProduto perda, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
