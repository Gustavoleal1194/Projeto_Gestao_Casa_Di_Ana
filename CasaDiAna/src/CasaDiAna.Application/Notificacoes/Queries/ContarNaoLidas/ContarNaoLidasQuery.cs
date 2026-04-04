using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Notificacoes.Queries.ContarNaoLidas;

public record ContarNaoLidasQuery : IRequest<int>;

public class ContarNaoLidasQueryHandler : IRequestHandler<ContarNaoLidasQuery, int>
{
    private readonly INotificacaoEstoqueRepository _notificacoes;

    public ContarNaoLidasQueryHandler(INotificacaoEstoqueRepository notificacoes)
        => _notificacoes = notificacoes;

    public async Task<int> Handle(ContarNaoLidasQuery request, CancellationToken cancellationToken)
        => await _notificacoes.ContarNaoLidasAsync(cancellationToken);
}
