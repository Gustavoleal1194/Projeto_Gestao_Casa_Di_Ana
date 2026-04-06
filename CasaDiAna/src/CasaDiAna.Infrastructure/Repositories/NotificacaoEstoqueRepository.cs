using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CasaDiAna.Infrastructure.Repositories;

public class NotificacaoEstoqueRepository : INotificacaoEstoqueRepository
{
    private readonly AppDbContext _db;

    public NotificacaoEstoqueRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<NotificacaoEstoque>> ListarAsync(
        bool apenasNaoLidas = false,
        CancellationToken ct = default)
    {
        var query = _db.NotificacoesEstoque
            .Include(n => n.Ingrediente)
            .AsQueryable();

        if (apenasNaoLidas)
            query = query.Where(n => !n.Lida);

        return await query
            .OrderByDescending(n => n.DataCriacao)
            .ToListAsync(ct);
    }

    public async Task<bool> ExisteNaoLidaParaIngredienteAsync(
        Guid ingredienteId,
        TipoNotificacaoEstoque nivel,
        CancellationToken ct = default)
    {
        return await _db.NotificacoesEstoque
            .AnyAsync(n => n.IngredienteId == ingredienteId && !n.Lida && n.Tipo == nivel, ct);
    }

    public async Task<int> ContarNaoLidasAsync(CancellationToken ct = default)
    {
        return await _db.NotificacoesEstoque
            .CountAsync(n => !n.Lida, ct);
    }

    public async Task<NotificacaoEstoque?> ObterPorIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.NotificacoesEstoque
            .Include(n => n.Ingrediente)
            .FirstOrDefaultAsync(n => n.Id == id, ct);
    }

    public async Task AdicionarAsync(NotificacaoEstoque notificacao, CancellationToken ct = default)
    {
        await _db.NotificacoesEstoque.AddAsync(notificacao, ct);
    }

    public void Atualizar(NotificacaoEstoque notificacao)
    {
        _db.NotificacoesEstoque.Update(notificacao);
    }

    public async Task MarcarTodasComoLidasAsync(CancellationToken ct = default)
    {
        await _db.NotificacoesEstoque
            .Where(n => !n.Lida)
            .ExecuteUpdateAsync(
                s => s.SetProperty(n => n.Lida, true),
                ct);
    }

    public async Task<int> SalvarAsync(CancellationToken ct = default)
    {
        return await _db.SaveChangesAsync(ct);
    }
}
