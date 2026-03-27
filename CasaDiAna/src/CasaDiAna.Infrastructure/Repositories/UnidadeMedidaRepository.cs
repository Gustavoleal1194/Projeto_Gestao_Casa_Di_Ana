using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class UnidadeMedidaRepository : IUnidadeMedidaRepository
{
    private readonly AppDbContext _db;

    public UnidadeMedidaRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<UnidadeMedida>> ListarAsync(CancellationToken ct = default) =>
        await _db.UnidadesMedida.OrderBy(u => u.Codigo).ToListAsync(ct);

    public Task<bool> ExisteAsync(short id, CancellationToken ct = default) =>
        _db.UnidadesMedida.AnyAsync(u => u.Id == id, ct);
}
