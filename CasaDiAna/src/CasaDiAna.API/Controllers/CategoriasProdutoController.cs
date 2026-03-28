using CasaDiAna.Application.CategoriasProduto.Commands.AtualizarCategoriaProduto;
using CasaDiAna.Application.CategoriasProduto.Commands.CriarCategoriaProduto;
using CasaDiAna.Application.CategoriasProduto.Commands.DesativarCategoriaProduto;
using CasaDiAna.Application.CategoriasProduto.Dtos;
using CasaDiAna.Application.CategoriasProduto.Queries.ListarCategoriasProduto;
using CasaDiAna.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/categorias-produto")]
[Authorize]
public class CategoriasProdutoController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriasProdutoController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CategoriaProdutoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasAtivos = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarCategoriasProdutoQuery(apenasAtivos), ct);
        return Ok(ApiResponse<IReadOnlyList<CategoriaProdutoDto>>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CategoriaProdutoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar(
        [FromBody] CriarCategoriaProdutoCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<CategoriaProdutoDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CategoriaProdutoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarCategoriaProdutoCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<CategoriaProdutoDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarCategoriaProdutoCommand(id), ct);
        return NoContent();
    }
}
