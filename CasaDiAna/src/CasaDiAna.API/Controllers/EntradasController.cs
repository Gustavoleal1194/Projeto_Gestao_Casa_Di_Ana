using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.CancelarEntrada;
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Application.Entradas.Queries.ListarEntradas;
using CasaDiAna.Application.Entradas.Queries.ObterEntrada;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/entradas")]
[Authorize]
public class EntradasController : ControllerBase
{
    private readonly IMediator _mediator;

    public EntradasController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<EntradaMercadoriaResumoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] DateTime? de = null,
        [FromQuery] DateTime? ate = null,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarEntradasQuery(de, ate), ct);
        return Ok(ApiResponse<IReadOnlyList<EntradaMercadoriaResumoDto>>.Ok(resultado));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<EntradaMercadoriaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ObterPorId(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterEntradaQuery(id), ct);
        return Ok(ApiResponse<EntradaMercadoriaDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<EntradaMercadoriaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Registrar(
        [FromBody] RegistrarEntradaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(ObterPorId), new { id = resultado.Id },
            ApiResponse<EntradaMercadoriaDto>.Ok(resultado));
    }

    [HttpPost("{id:guid}/cancelar")]
    [ProducesResponseType(typeof(ApiResponse<EntradaMercadoriaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancelar(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new CancelarEntradaCommand(id), ct);
        return Ok(ApiResponse<EntradaMercadoriaDto>.Ok(resultado));
    }
}
