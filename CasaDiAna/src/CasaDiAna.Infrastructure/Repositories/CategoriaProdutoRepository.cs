using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class CategoriaProdutoRepository : ICategoriaProdutoRepository
{
    private readonly AppDbContext _db;

    public CategoriaProdutoRepository(AppDbContext db) => _db = db;

    public Task<CategoriaProduto?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.CategoriasProduto.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<CategoriaProduto>> ListarAsync(
        bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.CategoriasProduto.AsQueryable();
        if (apenasAtivos)
            query = query.Where(c => c.Ativo);
        return await query.OrderBy(c => c.Nome).ToListAsync(ct);
    }

    public Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.CategoriasProduto.AnyAsync(c =>
            c.Ativo && c.Nome == nome && (ignorarId == null || c.Id != ignorarId), ct);

    public async Task AdicionarAsync(CategoriaProduto categoria, CancellationToken ct = default) =>
        await _db.CategoriasProduto.AddAsync(categoria, ct);

    public void Atualizar(CategoriaProduto categoria) =>
        _db.CategoriasProduto.Update(categoria);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
