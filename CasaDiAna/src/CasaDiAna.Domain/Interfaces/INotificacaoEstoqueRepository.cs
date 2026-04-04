using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface INotificacaoEstoqueRepository
{
    Task<IReadOnlyList<NotificacaoEstoque>> ListarAsync(
        bool apenasNaoLidas = false,
        CancellationToken ct = default);

    Task<bool> ExisteNaoLidaParaIngredienteAsync(
        Guid ingredienteId,
        CancellationToken ct = default);

    Task<int> ContarNaoLidasAsync(CancellationToken ct = default);

    Task<NotificacaoEstoque?> ObterPorIdAsync(Guid id, CancellationToken ct = default);

    Task AdicionarAsync(NotificacaoEstoque notificacao, CancellationToken ct = default);

    void Atualizar(NotificacaoEstoque notificacao);

    Task MarcarTodasComoLidasAsync(CancellationToken ct = default);

    Task<int> SalvarAsync(CancellationToken ct = default);
}
