using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ProducaoDiariaRepository : IProducaoDiariaRepository
{
    private readonly AppDbContext _db;

    public ProducaoDiariaRepository(AppDbContext db) => _db = db;

    public Task<ProducaoDiaria?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.ProducoesDiarias
            .Include(p => p.Produto)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<ProducaoDiaria>> ListarAsync(
        DateTime? de = null,
        DateTime? ate = null,
        IReadOnlyList<Guid>? produtoIds = null,
        CancellationToken ct = default)
    {
        var query = _db.ProducoesDiarias
            .Include(p => p.Produto)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(p => p.Data >= de.Value.Date);
        if (ate.HasValue)
            query = query.Where(p => p.Data < ate.Value.Date.AddDays(1));

        var ids = produtoIds?.ToList();
        if (ids?.Count > 0)
            query = query.Where(p => ids.Contains(p.ProdutoId));

        return await query.OrderByDescending(p => p.Data).ThenBy(p => p.Produto!.Nome).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ProducaoDiaria>> ListarPorIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default)
    {
        var idList = ids.ToList();
        return await _db.ProducoesDiarias
            .Include(p => p.Produto)
            .Where(p => idList.Contains(p.Id))
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(ProducaoDiaria producao, CancellationToken ct = default) =>
        await _db.ProducoesDiarias.AddAsync(producao, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
