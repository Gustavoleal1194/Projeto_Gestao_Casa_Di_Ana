using CasaDiAna.Application.Common;
using CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Commands.CancelarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Application.DespesasFixas.Queries.ListarDespesasFixas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/despesas-fixas")]
[Authorize(Roles = "Admin,Coordenador")]
public class DespesasFixasController : ControllerBase
{
    private readonly IMediator _mediator;

    public DespesasFixasController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DespesasFixasMesDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar([FromQuery] DateTime competencia, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ListarDespesasFixasQuery(competencia), ct);
        return Ok(ApiResponse<DespesasFixasMesDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DespesaFixaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Criar([FromBody] CriarDespesaFixaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<DespesaFixaDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DespesaFixaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarDespesaFixaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<DespesaFixaDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancelar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new CancelarDespesaFixaCommand(id), ct);
        return NoContent();
    }
}
