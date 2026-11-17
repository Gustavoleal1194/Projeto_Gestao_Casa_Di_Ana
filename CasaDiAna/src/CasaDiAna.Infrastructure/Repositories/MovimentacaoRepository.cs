using CasaDiAna.Domain.Common;
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

        // CriadoEm é instante UTC; de/ate são dias do calendário da loja
        if (de.HasValue)
        {
            var inicio = FusoHorarioLoja.InicioDoDiaEmUtc(de.Value);
            query = query.Where(m => m.CriadoEm >= inicio);
        }
        if (ate.HasValue)
        {
            var fim = FusoHorarioLoja.InicioDoDiaEmUtc(ate.Value.Date.AddDays(1));
            query = query.Where(m => m.CriadoEm < fim);
        }

        return await query.OrderByDescending(m => m.CriadoEm).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Movimentacao>> ListarAsync(
        DateTime de, DateTime ate, TipoMovimentacao? tipo = null, CancellationToken ct = default)
    {
        // CriadoEm é instante UTC; de/ate são dias do calendário da loja
        var (inicio, fim) = FusoHorarioLoja.PeriodoEmUtc(de, ate);
        var query = _db.Movimentacoes
            .Where(m => m.CriadoEm >= inicio && m.CriadoEm < fim)
            .AsQueryable();

        if (tipo.HasValue)
            query = query.Where(m => m.Tipo == tipo.Value);

        return await query.OrderByDescending(m => m.CriadoEm).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Movimentacao>> ListarPorReferenciasAsync(
        TipoMovimentacao tipo, IReadOnlyCollection<Guid> referenciaIds, CancellationToken ct = default)
    {
        if (referenciaIds.Count == 0)
            return Array.Empty<Movimentacao>();

        return await _db.Movimentacoes
            .Where(m => m.Tipo == tipo && m.ReferenciaId.HasValue && referenciaIds.Contains(m.ReferenciaId.Value))
            .ToListAsync(ct);
    }

    public async Task AdicionarAsync(Movimentacao movimentacao, CancellationToken ct = default) =>
        await _db.Movimentacoes.AddAsync(movimentacao, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
