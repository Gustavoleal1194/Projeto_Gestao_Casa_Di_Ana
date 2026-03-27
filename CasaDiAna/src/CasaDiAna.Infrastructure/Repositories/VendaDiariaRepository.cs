using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class VendaDiariaRepository : IVendaDiariaRepository
{
    private readonly AppDbContext _db;

    public VendaDiariaRepository(AppDbContext db) => _db = db;

    public Task<VendaDiaria?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.VendasDiarias
            .Include(v => v.Produto)
            .FirstOrDefaultAsync(v => v.Id == id, ct);

    public async Task<IReadOnlyList<VendaDiaria>> ListarAsync(
        DateTime? de = null,
        DateTime? ate = null,
        Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var query = _db.VendasDiarias
            .Include(v => v.Produto)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(v => v.Data >= de.Value);
        if (ate.HasValue)
            query = query.Where(v => v.Data <= ate.Value);
        if (produtoId.HasValue)
            query = query.Where(v => v.ProdutoId == produtoId.Value);

        return await query.OrderByDescending(v => v.Data).ThenBy(v => v.Produto!.Nome).ToListAsync(ct);
    }

    public async Task AdicionarAsync(VendaDiaria venda, CancellationToken ct = default) =>
        await _db.VendasDiarias.AddAsync(venda, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
