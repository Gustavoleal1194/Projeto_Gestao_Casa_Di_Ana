using CasaDiAna.Application.Common;
using CasaDiAna.Application.Utensilios.Commands.AtualizarUtensilio;
using CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;
using CasaDiAna.Application.Utensilios.Commands.DesativarUtensilio;
using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Application.Utensilios.Queries.ListarUtensilios;
using CasaDiAna.Application.Utensilios.Queries.ObterUtensilio;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/utensilios")]
[Authorize]
public class UtensiliosController : ControllerBase
{
    private readonly IMediator _mediator;

    public UtensiliosController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UtensilioResumoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasAtivos = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarUtensiliosQuery(apenasAtivos), ct);
        return Ok(ApiResponse<IReadOnlyList<UtensilioResumoDto>>.Ok(resultado));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<UtensilioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ObterPorId(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterUtensilioQuery(id), ct);
        return Ok(ApiResponse<UtensilioDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UtensilioDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar([FromBody] CriarUtensilioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(ObterPorId), new { id = resultado.Id },
            ApiResponse<UtensilioDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<UtensilioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarUtensilioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<UtensilioDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarUtensilioCommand(id), ct);
        return NoContent();
    }
}
