using CasaDiAna.Application.Common;
using CasaDiAna.Application.Ingredientes.Commands.AtualizarCustoIngrediente;
using CasaDiAna.Application.Ingredientes.Commands.AtualizarIngrediente;
using CasaDiAna.Application.Ingredientes.Commands.CriarIngrediente;
using CasaDiAna.Application.Ingredientes.Commands.DesativarIngrediente;
using CasaDiAna.Application.Ingredientes.Dtos;
using CasaDiAna.Application.Ingredientes.Queries.ListarIngredientes;
using CasaDiAna.Application.Ingredientes.Queries.ObterIngrediente;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/ingredientes")]
[Authorize]
public class IngredientesController : ControllerBase
{
    private readonly IMediator _mediator;

    public IngredientesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<IngredienteResumoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasAtivos = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarIngredientesQuery(apenasAtivos), ct);
        return Ok(ApiResponse<IReadOnlyList<IngredienteResumoDto>>.Ok(resultado));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<IngredienteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ObterPorId(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterIngredienteQuery(id), ct);
        return Ok(ApiResponse<IngredienteDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<IngredienteDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar([FromBody] CriarIngredienteCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(ObterPorId), new { id = resultado.Id },
            ApiResponse<IngredienteDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<IngredienteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarIngredienteCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<IngredienteDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarIngredienteCommand(id), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/custo")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AtualizarCusto(
        Guid id, [FromBody] AtualizarCustoIngredienteCommand command, CancellationToken ct)
    {
        await _mediator.Send(command with { Id = id }, ct);
        return NoContent();
    }
}
