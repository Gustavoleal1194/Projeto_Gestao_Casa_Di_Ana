using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class UtensilioRepository : IUtensilioRepository
{
    private readonly AppDbContext _db;

    public UtensilioRepository(AppDbContext db) => _db = db;

    public Task<Utensilio?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Utensilios
            .Include(u => u.UnidadeMedida)
            .Include(u => u.Categoria)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<IReadOnlyList<Utensilio>> ListarAsync(
        bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.Utensilios
            .Include(u => u.UnidadeMedida)
            .Include(u => u.Categoria)
            .AsQueryable();

        if (apenasAtivos)
            query = query.Where(u => u.Ativo);

        return await query.OrderBy(u => u.Nome).ToListAsync(ct);
    }

    public Task<bool> CodigoInternoExisteAsync(
        string codigo, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.Utensilios.AnyAsync(u =>
            u.CodigoInterno == codigo &&
            (ignorarId == null || u.Id != ignorarId), ct);

    public async Task AdicionarAsync(Utensilio utensilio, CancellationToken ct = default) =>
        await _db.Utensilios.AddAsync(utensilio, ct);

    public void Atualizar(Utensilio utensilio) =>
        _db.Utensilios.Update(utensilio);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
