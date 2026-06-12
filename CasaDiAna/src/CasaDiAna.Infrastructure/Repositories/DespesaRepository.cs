using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class DespesaRepository : IDespesaRepository
{
    private readonly AppDbContext _db;

    public DespesaRepository(AppDbContext db) => _db = db;

    public Task<Despesa?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Despesas.FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task<IReadOnlyList<Despesa>> ListarPorCompetenciaAsync(
        DateTime competencia, CancellationToken ct = default)
    {
        var comp = Despesa.NormalizarCompetencia(competencia);
        return await _db.Despesas
            .Where(d => d.Ativo && d.Competencia == comp)
            .OrderBy(d => d.Tipo).ThenBy(d => d.Categoria).ThenByDescending(d => d.DataLancamento)
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(Despesa despesa, CancellationToken ct = default) =>
        await _db.Despesas.AddAsync(despesa, ct);

    public void Atualizar(Despesa despesa) => _db.Despesas.Update(despesa);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
