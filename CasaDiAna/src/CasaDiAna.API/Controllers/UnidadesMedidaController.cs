using CasaDiAna.Application.Common;
using CasaDiAna.Application.UnidadesMedida.Dtos;
using CasaDiAna.Application.UnidadesMedida.Queries.ListarUnidadesMedida;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/unidades-medida")]
[Authorize]
public class UnidadesMedidaController : ControllerBase
{
    private readonly IMediator _mediator;

    public UnidadesMedidaController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UnidadeMedidaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ListarUnidadesMedidaQuery(), ct);
        return Ok(ApiResponse<IReadOnlyList<UnidadeMedidaDto>>.Ok(resultado));
    }
}
