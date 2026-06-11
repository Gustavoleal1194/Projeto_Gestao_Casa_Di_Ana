using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class ConfiguracaoPrecificacaoRepository : IConfiguracaoPrecificacaoRepository
{
    private readonly AppDbContext _db;

    public ConfiguracaoPrecificacaoRepository(AppDbContext db) => _db = db;

    public Task<ConfiguracaoPrecificacao?> ObterAsync(CancellationToken ct = default) =>
        _db.ConfiguracoesPrecificacao.FirstOrDefaultAsync(ct);

    public async Task AdicionarAsync(ConfiguracaoPrecificacao config, CancellationToken ct = default) =>
        await _db.ConfiguracoesPrecificacao.AddAsync(config, ct);

    public void Atualizar(ConfiguracaoPrecificacao config) =>
        _db.ConfiguracoesPrecificacao.Update(config);

    public Task<int> SalvarAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
