using CasaDiAna.Application.Common;
using CasaDiAna.Application.Estoque.Commands.CorrigirEstoque;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/estoque")]
[Authorize]
public class EstoqueController : ControllerBase
{
    private readonly IMediator _mediator;

    public EstoqueController(IMediator mediator) => _mediator = mediator;

    /// <summary>Corrige o estoque de um ou mais ingredientes definindo a quantidade real.</summary>
    [HttpPost("correcoes")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CorrigirEstoque(
        [FromBody] CorrigirEstoqueCommand command, CancellationToken ct)
    {
        await _mediator.Send(command, ct);
        return NoContent();
    }
}
