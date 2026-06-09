using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class DespesaFixaRepository : IDespesaFixaRepository
{
    private readonly AppDbContext _db;

    public DespesaFixaRepository(AppDbContext db) => _db = db;

    public Task<DespesaFixa?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.DespesasFixas.FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task<IReadOnlyList<DespesaFixa>> ListarPorCompetenciaAsync(
        DateTime competencia, CancellationToken ct = default)
    {
        var comp = DespesaFixa.NormalizarCompetencia(competencia);
        return await _db.DespesasFixas
            .Where(d => d.Ativo && d.Competencia == comp)
            .OrderBy(d => d.Categoria)
            .ThenByDescending(d => d.DataLancamento)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(DespesaFixa despesa, CancellationToken ct = default) =>
        await _db.DespesasFixas.AddAsync(despesa, ct);

    public void Atualizar(DespesaFixa despesa) => _db.DespesasFixas.Update(despesa);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
