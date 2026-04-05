using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IModeloEtiquetaNutricionalRepository
{
    Task<ModeloEtiquetaNutricional?> ObterPorProdutoIdAsync(Guid produtoId, CancellationToken ct = default);
    Task AdicionarAsync(ModeloEtiquetaNutricional modelo, CancellationToken ct = default);
    void Atualizar(ModeloEtiquetaNutricional modelo);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
