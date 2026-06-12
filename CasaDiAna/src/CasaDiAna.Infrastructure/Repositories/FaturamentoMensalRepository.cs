using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class FaturamentoMensalRepository : IFaturamentoMensalRepository
{
    private readonly AppDbContext _db;

    public FaturamentoMensalRepository(AppDbContext db) => _db = db;

    public Task<FaturamentoMensal?> ObterPorCompetenciaAsync(DateTime competencia, CancellationToken ct = default)
    {
        var comp = Despesa.NormalizarCompetencia(competencia);
        return _db.FaturamentosMensais.FirstOrDefaultAsync(f => f.Competencia == comp, ct);
    }

    public async Task AdicionarAsync(FaturamentoMensal faturamento, CancellationToken ct = default) =>
        await _db.FaturamentosMensais.AddAsync(faturamento, ct);

    public void Atualizar(FaturamentoMensal faturamento) => _db.FaturamentosMensais.Update(faturamento);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
