using CasaDiAna.Application.Notificacoes.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Notificacoes.Queries.ListarNotificacoes;

public record ListarNotificacoesQuery(bool ApenasNaoLidas = false)
    : IRequest<IReadOnlyList<NotificacaoEstoqueDto>>;

public class ListarNotificacoesQueryHandler
    : IRequestHandler<ListarNotificacoesQuery, IReadOnlyList<NotificacaoEstoqueDto>>
{
    private readonly INotificacaoEstoqueRepository _notificacoes;

    public ListarNotificacoesQueryHandler(INotificacaoEstoqueRepository notificacoes)
        => _notificacoes = notificacoes;

    public async Task<IReadOnlyList<NotificacaoEstoqueDto>> Handle(
        ListarNotificacoesQuery request, CancellationToken cancellationToken)
    {
        var lista = await _notificacoes.ListarAsync(request.ApenasNaoLidas, cancellationToken);
        return lista.Select(ToDto).ToList();
    }

    internal static NotificacaoEstoqueDto ToDto(NotificacaoEstoque n) => new(
        n.Id,
        n.Titulo,
        n.Mensagem,
        n.Tipo.ToString(),
        n.DataCriacao,
        n.Lida,
        n.IngredienteId,
        n.Ingrediente?.Nome
    );
}
