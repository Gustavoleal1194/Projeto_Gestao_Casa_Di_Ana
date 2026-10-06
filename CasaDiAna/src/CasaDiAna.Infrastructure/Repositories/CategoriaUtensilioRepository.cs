using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class CategoriaUtensilioRepository : ICategoriaUtensilioRepository
{
    private readonly AppDbContext _db;

    public CategoriaUtensilioRepository(AppDbContext db) => _db = db;

    public Task<CategoriaUtensilio?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.CategoriasUtensilio.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<CategoriaUtensilio>> ListarAsync(
        bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.CategoriasUtensilio.AsQueryable();
        if (apenasAtivos)
            query = query.Where(c => c.Ativo);
        return await query.OrderBy(c => c.Nome).ToListAsync(ct);
    }

    public Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.CategoriasUtensilio.AnyAsync(c =>
            c.Ativo && c.Nome == nome && (ignorarId == null || c.Id != ignorarId), ct);

    public async Task AdicionarAsync(CategoriaUtensilio categoria, CancellationToken ct = default) =>
        await _db.CategoriasUtensilio.AddAsync(categoria, ct);

    public void Atualizar(CategoriaUtensilio categoria) =>
        _db.CategoriasUtensilio.Update(categoria);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
