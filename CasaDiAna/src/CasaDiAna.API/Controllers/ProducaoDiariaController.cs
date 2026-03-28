using CasaDiAna.Application.Common;
using CasaDiAna.Application.ProducaoDiaria.Commands.RegistrarProducao;
using CasaDiAna.Application.ProducaoDiaria.Dtos;
using CasaDiAna.Application.ProducaoDiaria.Queries.ListarProducao;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/producao-diaria")]
[Authorize]
public class ProducaoDiariaController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProducaoDiariaController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ProducaoDiariaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] DateTime? de = null,
        [FromQuery] DateTime? ate = null,
        [FromQuery] Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarProducaoQuery(de, ate, produtoId), ct);
        return Ok(ApiResponse<IReadOnlyList<ProducaoDiariaDto>>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ProducaoDiariaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Registrar(
        [FromBody] RegistrarProducaoCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ProducaoDiariaDto>.Ok(resultado));
    }
}
