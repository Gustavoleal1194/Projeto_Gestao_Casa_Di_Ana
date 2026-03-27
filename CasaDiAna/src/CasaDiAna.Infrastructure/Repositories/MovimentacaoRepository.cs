using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class MovimentacaoRepository : IMovimentacaoRepository
{
    private readonly AppDbContext _db;

    public MovimentacaoRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Movimentacao>> ListarPorIngredienteAsync(
        Guid ingredienteId, DateTime? de = null, DateTime? ate = null, CancellationToken ct = default)
    {
        var query = _db.Movimentacoes
            .Where(m => m.IngredienteId == ingredienteId)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(m => m.CriadoEm >= de.Value);
        if (ate.HasValue)
            query = query.Where(m => m.CriadoEm <= ate.Value);

        return await query.OrderByDescending(m => m.CriadoEm).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Movimentacao>> ListarAsync(
        DateTime de, DateTime ate, TipoMovimentacao? tipo = null, CancellationToken ct = default)
    {
        var query = _db.Movimentacoes
            .Where(m => m.CriadoEm >= de && m.CriadoEm <= ate)
            .AsQueryable();

        if (tipo.HasValue)
            query = query.Where(m => m.Tipo == tipo.Value);

        return await query.OrderByDescending(m => m.CriadoEm).ToListAsync(ct);
    }

    public async Task AdicionarAsync(Movimentacao movimentacao, CancellationToken ct = default) =>
        await _db.Movimentacoes.AddAsync(movimentacao, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
