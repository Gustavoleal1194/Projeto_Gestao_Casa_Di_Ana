using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ImportacaoVendasRepository : IImportacaoVendasRepository
{
    private readonly AppDbContext _db;

    public ImportacaoVendasRepository(AppDbContext db) => _db = db;

    public Task<bool> HashExisteAsync(string hash, CancellationToken ct = default) =>
        _db.ImportacoesVendas.AnyAsync(i => i.HashConteudo == hash, ct);

    public async Task AdicionarAsync(ImportacaoVendas importacao, CancellationToken ct = default) =>
        await _db.ImportacoesVendas.AddAsync(importacao, ct);

    public async Task<IReadOnlyList<ImportacaoVendas>> ListarAsync(CancellationToken ct = default) =>
        await _db.ImportacoesVendas
            .OrderByDescending(i => i.CriadoEm)
            .ToListAsync(ct);
}
