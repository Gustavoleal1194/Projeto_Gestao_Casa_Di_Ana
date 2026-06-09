using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Application.FechamentoMensal.Queries.ObterFechamentoMensal;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/fechamento-mensal")]
[Authorize(Roles = "Admin,Coordenador")]
public class FechamentoMensalController : ControllerBase
{
    private readonly IMediator _mediator;

    public FechamentoMensalController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<FechamentoMensalDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Obter([FromQuery] DateTime competencia, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterFechamentoMensalQuery(competencia), ct);
        return Ok(ApiResponse<FechamentoMensalDto>.Ok(resultado));
    }

    [HttpPut("faturamento-manual")]
    [ProducesResponseType(typeof(ApiResponse<FaturamentoMensalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DefinirFaturamentoManual(
        [FromBody] DefinirFaturamentoManualCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<FaturamentoMensalDto>.Ok(resultado));
    }
}
