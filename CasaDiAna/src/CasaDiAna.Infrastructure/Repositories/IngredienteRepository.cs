using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class IngredienteRepository : IIngredienteRepository
{
    private readonly AppDbContext _db;

    public IngredienteRepository(AppDbContext db) => _db = db;

    public Task<Ingrediente?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Ingredientes
            .Include(i => i.UnidadeMedida)
            .Include(i => i.Categoria)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

    public async Task<IReadOnlyList<Ingrediente>> ListarAsync(
        bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.Ingredientes
            .Include(i => i.UnidadeMedida)
            .Include(i => i.Categoria)
            .AsQueryable();

        if (apenasAtivos)
            query = query.Where(i => i.Ativo);

        return await query.OrderBy(i => i.Nome).ToListAsync(ct);
    }

    public Task<bool> CodigoInternoExisteAsync(
        string codigo, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.Ingredientes.AnyAsync(i =>
            i.CodigoInterno == codigo &&
            (ignorarId == null || i.Id != ignorarId), ct);

    public async Task AdicionarAsync(Ingrediente ingrediente, CancellationToken ct = default) =>
        await _db.Ingredientes.AddAsync(ingrediente, ct);

    public void Atualizar(Ingrediente ingrediente) =>
        _db.Ingredientes.Update(ingrediente);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
