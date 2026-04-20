// src/CasaDiAna.Infrastructure/Repositories/CodigoRecuperacaoRepository.cs
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class CodigoRecuperacaoRepository : ICodigoRecuperacaoRepository
{
    private readonly AppDbContext _db;

    public CodigoRecuperacaoRepository(AppDbContext db) => _db = db;

    public async Task AdicionarAsync(IEnumerable<CodigoRecuperacao> codigos, CancellationToken ct = default)
    {
        await _db.CodigosRecuperacao.AddRangeAsync(codigos, ct);
    }

    public async Task<IReadOnlyList<CodigoRecuperacao>> ObterAtivosPorUsuarioAsync(
        Guid usuarioId, CancellationToken ct = default)
    {
        return await _db.CodigosRecuperacao
            .Where(c => c.UsuarioId == usuarioId && c.UsadoEm == null)
            .ToListAsync(ct);
    }

    public async Task MarcarUsadoAsync(Guid id, CancellationToken ct = default)
    {
        var codigo = await _db.CodigosRecuperacao.FindAsync([id], ct);
        if (codigo is null) return;
        codigo.MarcarUsado();
    }

    public async Task DeletarPorUsuarioAsync(Guid usuarioId, CancellationToken ct = default)
    {
        await _db.CodigosRecuperacao
            .Where(c => c.UsuarioId == usuarioId)
            .ExecuteDeleteAsync(ct);
    }

    public Task SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
