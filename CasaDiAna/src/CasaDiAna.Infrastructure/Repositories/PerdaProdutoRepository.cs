using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class PerdaProdutoRepository : IPerdaProdutoRepository
{
    private readonly AppDbContext _db;

    public PerdaProdutoRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<PerdaProduto>> ListarAsync(
        DateTime? de = null,
        DateTime? ate = null,
        Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var query = _db.PerdasProduto
            .Include(p => p.Produto)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(p => p.Data >= de.Value);
        if (ate.HasValue)
            query = query.Where(p => p.Data < ate.Value.Date.AddDays(1));
        if (produtoId.HasValue)
            query = query.Where(p => p.ProdutoId == produtoId.Value);

        return await query.OrderByDescending(p => p.Data).ThenBy(p => p.Produto!.Nome).ToListAsync(ct);
    }

    public async Task AdicionarAsync(PerdaProduto perda, CancellationToken ct = default) =>
        await _db.PerdasProduto.AddAsync(perda, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
