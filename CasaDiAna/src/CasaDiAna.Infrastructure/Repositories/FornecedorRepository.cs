using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class FornecedorRepository : IFornecedorRepository
{
    private readonly AppDbContext _db;

    public FornecedorRepository(AppDbContext db) => _db = db;

    public Task<Fornecedor?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Fornecedores.FirstOrDefaultAsync(f => f.Id == id, ct);

    public async Task<IReadOnlyList<Fornecedor>> ListarAsync(
        bool apenasAtivos = true, CancellationToken ct = default)
    {
        var query = _db.Fornecedores.AsQueryable();
        if (apenasAtivos)
            query = query.Where(f => f.Ativo);
        return await query.OrderBy(f => f.RazaoSocial).ToListAsync(ct);
    }

    public Task<bool> CnpjExisteAsync(
        string cnpj, Guid? ignorarId = null, CancellationToken ct = default) =>
        _db.Fornecedores.AnyAsync(f =>
            f.Cnpj == cnpj &&
            (ignorarId == null || f.Id != ignorarId), ct);

    public async Task AdicionarAsync(Fornecedor fornecedor, CancellationToken ct = default) =>
        await _db.Fornecedores.AddAsync(fornecedor, ct);

    public void Atualizar(Fornecedor fornecedor) =>
        _db.Fornecedores.Update(fornecedor);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
