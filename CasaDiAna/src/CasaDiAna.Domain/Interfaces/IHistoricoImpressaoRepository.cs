using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IHistoricoImpressaoRepository
{
    Task<IReadOnlyList<HistoricoImpressaoEtiqueta>> ListarAsync(
        Guid? produtoId = null,
        CancellationToken ct = default);

    Task AdicionarAsync(HistoricoImpressaoEtiqueta historico, CancellationToken ct = default);

    Task<int> SalvarAsync(CancellationToken ct = default);
}
