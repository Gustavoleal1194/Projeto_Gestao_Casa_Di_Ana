using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using CategoriaDespesaEntity = CasaDiAna.Domain.Entities.CategoriaDespesa;

namespace CasaDiAna.Infrastructure.Repositories;

public class CategoriaDespesaRepository : ICategoriaDespesaRepository
{
    private readonly AppDbContext _db;

    public CategoriaDespesaRepository(AppDbContext db) => _db = db;

    public Task<CategoriaDespesaEntity?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.CategoriasDespesa.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<CategoriaDespesaEntity>> ListarAsync(
        TipoDespesa? tipo = null, bool apenasAtivas = true, CancellationToken ct = default)
    {
        var query = _db.CategoriasDespesa.AsQueryable();
        if (apenasAtivas) query = query.Where(c => c.Ativo);
        if (tipo.HasValue) query = query.Where(c => c.Tipo == tipo.Value);
        return await query.OrderBy(c => c.Tipo).ThenBy(c => c.Nome).ToListAsync(ct);
    }

    public Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.CategoriasDespesa.AnyAsync(c =>
            c.Ativo && c.Nome == nome && (ignorarId == null || c.Id != ignorarId), ct);

    public async Task AdicionarAsync(CategoriaDespesaEntity categoria, CancellationToken ct = default) =>
        await _db.CategoriasDespesa.AddAsync(categoria, ct);

    public void Atualizar(CategoriaDespesaEntity categoria) => _db.CategoriasDespesa.Update(categoria);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
