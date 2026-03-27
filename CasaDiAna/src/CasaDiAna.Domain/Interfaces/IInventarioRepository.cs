using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IInventarioRepository
{
    Task<Inventario?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Inventario>> ListarAsync(CancellationToken ct = default);
    Task AdicionarAsync(Inventario inventario, CancellationToken ct = default);
    Task AdicionarItemAsync(ItemInventario item, CancellationToken ct = default);
    void Atualizar(Inventario inventario);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
