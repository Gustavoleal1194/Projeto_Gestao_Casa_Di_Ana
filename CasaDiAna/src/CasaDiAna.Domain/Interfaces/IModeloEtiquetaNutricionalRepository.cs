using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IModeloEtiquetaNutricionalRepository
{
    Task<IReadOnlyList<ModeloEtiquetaNutricional>> ListarTodosAsync(CancellationToken ct = default);
    Task<ModeloEtiquetaNutricional?> ObterPorProdutoIdAsync(Guid produtoId, CancellationToken ct = default);
    Task AdicionarAsync(ModeloEtiquetaNutricional modelo, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
