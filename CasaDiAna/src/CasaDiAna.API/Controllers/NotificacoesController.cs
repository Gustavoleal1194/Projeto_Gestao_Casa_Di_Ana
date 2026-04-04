using CasaDiAna.Application.Common;
using CasaDiAna.Application.Notificacoes.Commands.MarcarLida;
using CasaDiAna.Application.Notificacoes.Commands.MarcarTodasLidas;
using CasaDiAna.Application.Notificacoes.Dtos;
using CasaDiAna.Application.Notificacoes.Queries.ContarNaoLidas;
using CasaDiAna.Application.Notificacoes.Queries.ListarNotificacoes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/notificacoes")]
[Authorize]
public class NotificacoesController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificacoesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasNaoLidas = false,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarNotificacoesQuery(apenasNaoLidas), ct);
        return Ok(ApiResponse<IReadOnlyList<NotificacaoEstoqueDto>>.Ok(resultado));
    }

    [HttpGet("contagem")]
    public async Task<IActionResult> Contar(CancellationToken ct = default)
    {
        var total = await _mediator.Send(new ContarNaoLidasQuery(), ct);
        return Ok(ApiResponse<int>.Ok(total));
    }

    [HttpPatch("{id:guid}/lida")]
    public async Task<IActionResult> MarcarLida(Guid id, CancellationToken ct = default)
    {
        await _mediator.Send(new MarcarLidaCommand(id), ct);
        return NoContent();
    }

    [HttpPatch("marcar-todas-lidas")]
    public async Task<IActionResult> MarcarTodasLidas(CancellationToken ct = default)
    {
        await _mediator.Send(new MarcarTodasLidasCommand(), ct);
        return NoContent();
    }
}
