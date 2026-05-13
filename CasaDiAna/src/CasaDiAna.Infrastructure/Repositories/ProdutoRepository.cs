using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ProdutoRepository : IProdutoRepository
{
    private readonly AppDbContext _db;

    public ProdutoRepository(AppDbContext db) => _db = db;

    public Task<bool> ExisteAsync(Guid id, CancellationToken ct = default) =>
        _db.Produtos.AnyAsync(p => p.Id == id, ct);

    public Task<Produto?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Produtos
            .Include(p => p.Categoria)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public Task<Produto?> ObterPorIdComFichaAsync(Guid id, CancellationToken ct = default) =>
        _db.Produtos
            .Include(p => p.Categoria)
            .Include(p => p.ItensFicha)
                .ThenInclude(i => i.Ingrediente)
                    .ThenInclude(ing => ing!.UnidadeMedida)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<Produto>> ListarAsync(
        bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.Produtos.Include(p => p.Categoria).AsQueryable();
        if (apenasAtivos)
            query = query.Where(p => p.Ativo);
        return await query.OrderBy(p => p.Nome).ToListAsync(ct);
    }

    public Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.Produtos.AnyAsync(p =>
            p.Ativo && p.Nome == nome && (ignorarId == null || p.Id != ignorarId), ct);

    public async Task AdicionarAsync(Produto produto, CancellationToken ct = default) =>
        await _db.Produtos.AddAsync(produto, ct);

    public void Atualizar(Produto produto) =>
        _db.Produtos.Update(produto);

    public async Task SubstituirItensFichaAsync(Produto produto, CancellationToken ct = default)
    {
        var itensExistentes = await _db.ItensFichaTecnica
            .Where(i => i.ProdutoId == produto.Id)
            .ToListAsync(ct);

        _db.ItensFichaTecnica.RemoveRange(itensExistentes);
        await _db.ItensFichaTecnica.AddRangeAsync(produto.ItensFicha, ct);
        _db.Produtos.Update(produto);
    }

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
