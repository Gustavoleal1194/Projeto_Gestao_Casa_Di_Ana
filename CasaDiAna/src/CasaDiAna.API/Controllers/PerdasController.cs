using CasaDiAna.Application.Common;
using CasaDiAna.Application.Perdas.Commands.RegistrarPerda;
using CasaDiAna.Application.Perdas.Dtos;
using CasaDiAna.Application.Perdas.Queries.ListarPerdas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/perdas")]
[Authorize]
public class PerdasController : ControllerBase
{
    private readonly IMediator _mediator;

    public PerdasController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PerdaProdutoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] DateTime? de = null,
        [FromQuery] DateTime? ate = null,
        [FromQuery] Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarPerdasQuery(de, ate, produtoId), ct);
        return Ok(ApiResponse<IReadOnlyList<PerdaProdutoDto>>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PerdaProdutoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Registrar(
        [FromBody] RegistrarPerdaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<PerdaProdutoDto>.Ok(resultado));
    }
}
