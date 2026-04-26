using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class EntradaMercadoriaRepository : IEntradaMercadoriaRepository
{
    private readonly AppDbContext _db;

    public EntradaMercadoriaRepository(AppDbContext db) => _db = db;

    public Task<EntradaMercadoria?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default) =>
        _db.EntradasMercadoria
            .Include(e => e.Fornecedor)
            .Include(e => e.Itens)
                .ThenInclude(i => i.Ingrediente)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task<IReadOnlyList<EntradaMercadoria>> ListarAsync(
        DateTime? de = null, DateTime? ate = null, CancellationToken ct = default)
    {
        var query = _db.EntradasMercadoria
            .Include(e => e.Fornecedor)
            .Include(e => e.Itens)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(e => e.DataEntrada >= de.Value);
        if (ate.HasValue)
            query = query.Where(e => e.DataEntrada <= ate.Value);

        return await query.OrderByDescending(e => e.DataEntrada).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<EntradaMercadoria>> ListarParaComparacaoAsync(
        DateTime? de = null, DateTime? ate = null, CancellationToken ct = default)
    {
        var query = _db.EntradasMercadoria
            .Include(e => e.Fornecedor)
            .Include(e => e.Itens)
                .ThenInclude(i => i.Ingrediente)
                    .ThenInclude(i => i!.UnidadeMedida)
            .AsQueryable();

        if (de.HasValue)
            query = query.Where(e => e.DataEntrada >= de.Value);
        if (ate.HasValue)
            query = query.Where(e => e.DataEntrada < ate.Value.Date.AddDays(1));

        return await query.OrderBy(e => e.DataEntrada).ToListAsync(ct);
    }

    public async Task AdicionarAsync(EntradaMercadoria entrada, CancellationToken ct = default) =>
        await _db.EntradasMercadoria.AddAsync(entrada, ct);

    public void Atualizar(EntradaMercadoria entrada) =>
        _db.EntradasMercadoria.Update(entrada);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
