using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Application.Notificacoes.Services;

public interface INotificacaoEstoqueService
{
    Task VerificarECriarAsync(Ingrediente ingrediente, CancellationToken ct = default);
    Task MarcarComoLidaAsync(Guid id, CancellationToken ct = default);
    Task MarcarTodasComoLidasAsync(CancellationToken ct = default);
}
