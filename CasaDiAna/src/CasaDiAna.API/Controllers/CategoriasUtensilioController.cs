using CasaDiAna.Application.CategoriasUtensilio.Commands.AtualizarCategoriaUtensilio;
using CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;
using CasaDiAna.Application.CategoriasUtensilio.Commands.DesativarCategoriaUtensilio;
using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using CasaDiAna.Application.CategoriasUtensilio.Queries.ListarCategoriasUtensilio;
using CasaDiAna.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/categorias-utensilio")]
[Authorize]
public class CategoriasUtensilioController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriasUtensilioController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CategoriaUtensilioDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasAtivos = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarCategoriasUtensilioQuery(apenasAtivos), ct);
        return Ok(ApiResponse<IReadOnlyList<CategoriaUtensilioDto>>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CategoriaUtensilioDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar([FromBody] CriarCategoriaUtensilioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Listar), ApiResponse<CategoriaUtensilioDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CategoriaUtensilioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarCategoriaUtensilioCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<CategoriaUtensilioDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarCategoriaUtensilioCommand(id), ct);
        return NoContent();
    }
}
