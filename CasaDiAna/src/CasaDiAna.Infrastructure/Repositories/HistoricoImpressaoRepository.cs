using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class HistoricoImpressaoRepository : IHistoricoImpressaoRepository
{
    private readonly AppDbContext _db;

    public HistoricoImpressaoRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<HistoricoImpressaoEtiqueta>> ListarAsync(
        Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var query = _db.HistoricoImpressaoEtiquetas
            .Include(h => h.Produto)
            .AsQueryable();

        if (produtoId.HasValue)
            query = query.Where(h => h.ProdutoId == produtoId.Value);

        return await query
            .OrderByDescending(h => h.ImpressoEm)
            .Take(100)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(HistoricoImpressaoEtiqueta historico, CancellationToken ct = default) =>
        await _db.HistoricoImpressaoEtiquetas.AddAsync(historico, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
