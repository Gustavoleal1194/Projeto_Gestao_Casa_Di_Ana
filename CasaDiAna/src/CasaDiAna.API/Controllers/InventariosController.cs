using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Commands.AdicionarItemInventario;
using CasaDiAna.Application.Inventarios.Commands.CancelarInventario;
using CasaDiAna.Application.Inventarios.Commands.FinalizarInventario;
using CasaDiAna.Application.Inventarios.Commands.IniciarInventario;
using CasaDiAna.Application.Inventarios.Dtos;
using CasaDiAna.Application.Inventarios.Queries.ListarInventarios;
using CasaDiAna.Application.Inventarios.Queries.ObterInventario;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/inventarios")]
[Authorize]
public class InventariosController : ControllerBase
{
    private readonly IMediator _mediator;

    public InventariosController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<InventarioResumoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ListarInventariosQuery(), ct);
        return Ok(ApiResponse<IReadOnlyList<InventarioResumoDto>>.Ok(resultado));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<InventarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ObterPorId(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterInventarioQuery(id), ct);
        return Ok(ApiResponse<InventarioDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<InventarioDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Iniciar([FromBody] IniciarInventarioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(ObterPorId), new { id = resultado.Id },
            ApiResponse<InventarioDto>.Ok(resultado));
    }

    [HttpPost("{id:guid}/itens")]
    [ProducesResponseType(typeof(ApiResponse<InventarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AdicionarItem(
        Guid id, [FromBody] AdicionarItemInventarioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { InventarioId = id }, ct);
        return Ok(ApiResponse<InventarioDto>.Ok(resultado));
    }

    [HttpPost("{id:guid}/finalizar")]
    [ProducesResponseType(typeof(ApiResponse<InventarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Finalizar(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new FinalizarInventarioCommand(id), ct);
        return Ok(ApiResponse<InventarioDto>.Ok(resultado));
    }

    [HttpPost("{id:guid}/cancelar")]
    [ProducesResponseType(typeof(ApiResponse<InventarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancelar(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new CancelarInventarioCommand(id), ct);
        return Ok(ApiResponse<InventarioDto>.Ok(resultado));
    }
}
