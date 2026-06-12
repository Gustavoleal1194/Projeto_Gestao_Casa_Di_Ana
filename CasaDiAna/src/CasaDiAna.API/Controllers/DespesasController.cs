using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;
using CasaDiAna.Application.Despesas.Commands.CancelarDespesa;
using CasaDiAna.Application.Despesas.Commands.CriarDespesa;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Application.Despesas.Queries.ListarDespesas;
using CasaDiAna.Application.Despesas.Queries.ObterComprasMes;
using CasaDiAna.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/despesas")]
[Authorize(Roles = "Admin,Coordenador")]
public class DespesasController : ControllerBase
{
    private readonly IMediator _mediator;

    public DespesasController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DespesasMesDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] DateTime competencia, [FromQuery] TipoDespesa? tipo, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ListarDespesasQuery(competencia, tipo), ct);
        return Ok(ApiResponse<DespesasMesDto>.Ok(resultado));
    }

    [HttpGet("compras")]
    [ProducesResponseType(typeof(ApiResponse<ComprasMesDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Compras([FromQuery] DateTime competencia, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterComprasMesQuery(competencia), ct);
        return Ok(ApiResponse<ComprasMesDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DespesaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Criar([FromBody] CriarDespesaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<DespesaDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DespesaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarDespesaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<DespesaDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancelar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new CancelarDespesaCommand(id), ct);
        return NoContent();
    }
}
