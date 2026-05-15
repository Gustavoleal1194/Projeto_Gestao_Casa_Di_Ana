using CasaDiAna.Application.Common;
using CasaDiAna.Application.VendasDiarias.Commands.RegistrarVenda;
using CasaDiAna.Application.VendasDiarias.Dtos;
using CasaDiAna.Application.VendasDiarias.Queries.ListarVendas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/vendas-diarias")]
[Authorize]
public class VendasDiariasController : ControllerBase
{
    private readonly IMediator _mediator;

    public VendasDiariasController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<VendaDiariaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] DateTime? de = null,
        [FromQuery] DateTime? ate = null,
        [FromQuery] Guid[]? produtoIds = null,
        CancellationToken ct = default)
    {
        var ids = produtoIds != null && produtoIds.Length > 0
            ? (IReadOnlyList<Guid>)produtoIds
            : null;
        var resultado = await _mediator.Send(new ListarVendasQuery(de, ate, ids), ct);
        return Ok(ApiResponse<IReadOnlyList<VendaDiariaDto>>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<VendaDiariaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Registrar(
        [FromBody] RegistrarVendaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<VendaDiariaDto>.Ok(resultado));
    }
}
