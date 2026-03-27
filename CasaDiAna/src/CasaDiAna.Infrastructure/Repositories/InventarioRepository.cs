using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class InventarioRepository : IInventarioRepository
{
    private readonly AppDbContext _db;

    public InventarioRepository(AppDbContext db) => _db = db;

    public Task<Inventario?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default) =>
        _db.Inventarios
            .Include(inv => inv.Itens)
                .ThenInclude(i => i.Ingrediente)
                    .ThenInclude(ing => ing!.UnidadeMedida)
            .FirstOrDefaultAsync(inv => inv.Id == id, ct);

    public async Task<IReadOnlyList<Inventario>> ListarAsync(CancellationToken ct = default) =>
        await _db.Inventarios
            .Include(inv => inv.Itens)
            .OrderByDescending(inv => inv.DataRealizacao)
            .ToListAsync(ct);

    public async Task AdicionarAsync(Inventario inventario, CancellationToken ct = default) =>
        await _db.Inventarios.AddAsync(inventario, ct);

    public async Task AdicionarItemAsync(ItemInventario item, CancellationToken ct = default) =>
        await _db.ItensInventario.AddAsync(item, ct);

    public void Atualizar(Inventario inventario) =>
        _db.Inventarios.Update(inventario);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
