using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Application.Notificacoes.Services;

public interface INotificacaoEstoqueService
{
    Task VerificarECriarAsync(Ingrediente ingrediente, CancellationToken ct = default);
    Task MarcarComoLidaAsync(Guid id, CancellationToken ct = default);
    Task MarcarTodasComoLidasAsync(CancellationToken ct = default);

    /// <summary>
    /// Varre todos os ingredientes ativos e cria notificações para os que
    /// estão abaixo do mínimo e ainda não têm notificação ativa.
    /// Chamado na inicialização da API para cobrir estoque preexistente.
    /// </summary>
    Task SincronizarAsync(CancellationToken ct = default);
}
