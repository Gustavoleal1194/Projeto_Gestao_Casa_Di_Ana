using CasaDiAna.Application.Notificacoes.Services;
using MediatR;

namespace CasaDiAna.Application.Notificacoes.Commands.MarcarTodasLidas;

public record MarcarTodasLidasCommand : IRequest;

public class MarcarTodasLidasCommandHandler : IRequestHandler<MarcarTodasLidasCommand>
{
    private readonly INotificacaoEstoqueService _service;

    public MarcarTodasLidasCommandHandler(INotificacaoEstoqueService service) => _service = service;

    public async Task Handle(MarcarTodasLidasCommand request, CancellationToken cancellationToken)
        => await _service.MarcarTodasComoLidasAsync(cancellationToken);
}
