using CasaDiAna.Application.Notificacoes.Services;
using MediatR;

namespace CasaDiAna.Application.Notificacoes.Commands.MarcarLida;

public record MarcarLidaCommand(Guid Id) : IRequest;

public class MarcarLidaCommandHandler : IRequestHandler<MarcarLidaCommand>
{
    private readonly INotificacaoEstoqueService _service;

    public MarcarLidaCommandHandler(INotificacaoEstoqueService service) => _service = service;

    public async Task Handle(MarcarLidaCommand request, CancellationToken cancellationToken)
        => await _service.MarcarComoLidaAsync(request.Id, cancellationToken);
}
