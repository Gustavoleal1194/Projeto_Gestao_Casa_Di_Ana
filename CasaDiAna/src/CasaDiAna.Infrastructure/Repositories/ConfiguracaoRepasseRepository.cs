using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ConfiguracaoRepasseRepository : IConfiguracaoRepasseRepository
{
    private readonly AppDbContext _db;

    public ConfiguracaoRepasseRepository(AppDbContext db) => _db = db;

    public Task<ConfiguracaoRepasse?> ObterAsync(CancellationToken ct = default) =>
        _db.ConfiguracoesRepasse.OrderByDescending(c => c.AtualizadoEm).FirstOrDefaultAsync(ct);

    public async Task AdicionarAsync(ConfiguracaoRepasse config, CancellationToken ct = default) =>
        await _db.ConfiguracoesRepasse.AddAsync(config, ct);

    public void Atualizar(ConfiguracaoRepasse config) =>
        _db.ConfiguracoesRepasse.Update(config);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
