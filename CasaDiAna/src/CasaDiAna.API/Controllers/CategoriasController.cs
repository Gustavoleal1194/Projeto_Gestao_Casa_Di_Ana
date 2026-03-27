using CasaDiAna.Application.Categorias.Commands.AtualizarCategoria;
using CasaDiAna.Application.Categorias.Commands.CriarCategoria;
using CasaDiAna.Application.Categorias.Commands.DesativarCategoria;
using CasaDiAna.Application.Categorias.Dtos;
using CasaDiAna.Application.Categorias.Queries.ListarCategorias;
using CasaDiAna.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/categorias")]
[Authorize]
public class CategoriasController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriasController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CategoriaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasAtivos = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarCategoriasQuery(apenasAtivos), ct);
        return Ok(ApiResponse<IReadOnlyList<CategoriaDto>>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CategoriaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar([FromBody] CriarCategoriaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Listar), ApiResponse<CategoriaDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CategoriaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarCategoriaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<CategoriaDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarCategoriaCommand(id), ct);
        return NoContent();
    }
}
