using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class CategoriaIngredienteRepository : ICategoriaIngredienteRepository
{
    private readonly AppDbContext _db;

    public CategoriaIngredienteRepository(AppDbContext db) => _db = db;

    public Task<CategoriaIngrediente?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.CategoriasIngrediente.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<CategoriaIngrediente>> ListarAsync(
        bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.CategoriasIngrediente.AsQueryable();
        if (apenasAtivos)
            query = query.Where(c => c.Ativo);
        return await query.OrderBy(c => c.Nome).ToListAsync(ct);
    }

    public Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.CategoriasIngrediente.AnyAsync(c =>
            c.Ativo && c.Nome == nome && (ignorarId == null || c.Id != ignorarId), ct);

    public async Task AdicionarAsync(CategoriaIngrediente categoria, CancellationToken ct = default) =>
        await _db.CategoriasIngrediente.AddAsync(categoria, ct);

    public void Atualizar(CategoriaIngrediente categoria) =>
        _db.CategoriasIngrediente.Update(categoria);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
