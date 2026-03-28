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
        Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var query = _db.ProducoesDiarias
            .Include(p => p.Produto)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(p => p.Data >= de.Value);
        if (ate.HasValue)
            query = query.Where(p => p.Data <= ate.Value);
        if (produtoId.HasValue)
            query = query.Where(p => p.ProdutoId == produtoId.Value);

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
