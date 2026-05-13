using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ModeloEtiquetaNutricionalRepository : IModeloEtiquetaNutricionalRepository
{
    private readonly AppDbContext _db;

    public ModeloEtiquetaNutricionalRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<ModeloEtiquetaNutricional>> ListarTodosAsync(CancellationToken ct = default) =>
        await _db.ModelosEtiquetaNutricional
            .AsNoTracking()
            .Include(m => m.Produto)
            .OrderBy(m => m.Produto!.Nome)
            .ToListAsync(ct);

    public Task<ModeloEtiquetaNutricional?> ObterPorProdutoIdAsync(Guid produtoId, CancellationToken ct = default) =>
        _db.ModelosEtiquetaNutricional.FirstOrDefaultAsync(m => m.ProdutoId == produtoId, ct);

    public async Task AdicionarAsync(ModeloEtiquetaNutricional modelo, CancellationToken ct = default) =>
        await _db.ModelosEtiquetaNutricional.AddAsync(modelo, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
