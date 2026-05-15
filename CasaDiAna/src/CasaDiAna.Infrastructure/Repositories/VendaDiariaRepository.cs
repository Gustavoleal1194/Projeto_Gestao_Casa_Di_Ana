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
        IReadOnlyList<Guid>? produtoIds = null,
        CancellationToken ct = default)
    {
        var query = _db.VendasDiarias
            .Include(v => v.Produto)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(v => v.Data >= de.Value.Date);
        if (ate.HasValue)
            query = query.Where(v => v.Data < ate.Value.Date.AddDays(1));

        var ids = produtoIds?.ToList();
        if (ids?.Count > 0)
            query = query.Where(v => ids.Contains(v.ProdutoId));

        return await query.OrderByDescending(v => v.Data).ThenBy(v => v.Produto!.Nome).ToListAsync(ct);
    }

    public async Task AdicionarAsync(VendaDiaria venda, CancellationToken ct = default) =>
        await _db.VendasDiarias.AddAsync(venda, ct);

    public async Task AdicionarRangeAsync(IEnumerable<VendaDiaria> vendas, CancellationToken ct = default) =>
        await _db.VendasDiarias.AddRangeAsync(vendas, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
