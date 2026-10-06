using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;

namespace CasaDiAna.Infrastructure.Repositories;

public class MovimentacaoUtensilioRepository : IMovimentacaoUtensilioRepository
{
    private readonly AppDbContext _db;

    public MovimentacaoUtensilioRepository(AppDbContext db) => _db = db;

    public async Task AdicionarAsync(MovimentacaoUtensilio movimentacao, CancellationToken ct = default) =>
        await _db.MovimentacoesUtensilio.AddAsync(movimentacao, ct);

    public Task<int> SalvarAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
