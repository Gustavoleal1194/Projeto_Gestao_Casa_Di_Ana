using CasaDiAna.Application.Common;
using CasaDiAna.Application.Relatorios.Dtos;
using CasaDiAna.Application.Relatorios.Queries.Entradas;
using CasaDiAna.Application.Relatorios.Queries.EstoqueAtual;
using CasaDiAna.Application.Relatorios.Queries.Movimentacoes;
using CasaDiAna.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/relatorios")]
[Authorize]
public class RelatoriosController : ControllerBase
{
    private readonly IMediator _mediator;

    public RelatoriosController(IMediator mediator) => _mediator = mediator;

    [HttpGet("estoque-atual")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<EstoqueAtualItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> EstoqueAtual(
        [FromQuery] bool apenasAbaixoDoMinimo = false, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new EstoqueAtualQuery(apenasAbaixoDoMinimo), ct);
        return Ok(ApiResponse<IReadOnlyList<EstoqueAtualItemDto>>.Ok(resultado));
    }

    [HttpGet("movimentacoes")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MovimentacaoRelatorioDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Movimentacoes(
        [FromQuery] DateTime de,
        [FromQuery] DateTime ate,
        [FromQuery] TipoMovimentacao? tipo = null,
        [FromQuery] Guid? ingredienteId = null,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new MovimentacoesQuery(de, ate, tipo, ingredienteId), ct);
        return Ok(ApiResponse<IReadOnlyList<MovimentacaoRelatorioDto>>.Ok(resultado));
    }

    [HttpGet("entradas")]
    [ProducesResponseType(typeof(ApiResponse<EntradaRelatorioResumoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Entradas(
        [FromQuery] DateTime de,
        [FromQuery] DateTime ate,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new EntradasRelatorioQuery(de, ate), ct);
        return Ok(ApiResponse<EntradaRelatorioResumoDto>.Ok(resultado));
    }
}
