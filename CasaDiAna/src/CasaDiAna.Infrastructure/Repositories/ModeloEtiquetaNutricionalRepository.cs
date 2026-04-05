using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ModeloEtiquetaNutricionalRepository : IModeloEtiquetaNutricionalRepository
{
    private readonly AppDbContext _db;

    public ModeloEtiquetaNutricionalRepository(AppDbContext db) => _db = db;

    public Task<ModeloEtiquetaNutricional?> ObterPorProdutoIdAsync(Guid produtoId, CancellationToken ct = default) =>
        _db.ModelosEtiquetaNutricional.FirstOrDefaultAsync(m => m.ProdutoId == produtoId, ct);

    public async Task AdicionarAsync(ModeloEtiquetaNutricional modelo, CancellationToken ct = default) =>
        await _db.ModelosEtiquetaNutricional.AddAsync(modelo, ct);

    public void Atualizar(ModeloEtiquetaNutricional modelo) =>
        _db.ModelosEtiquetaNutricional.Update(modelo);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
