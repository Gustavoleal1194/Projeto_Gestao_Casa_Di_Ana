using CasaDiAna.Application.CategoriasDespesa.Commands.AtualizarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Commands.DesativarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Application.CategoriasDespesa.Queries.ListarCategoriasDespesa;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/categorias-despesa")]
[Authorize(Roles = "Admin,Coordenador")]
public class CategoriasDespesaController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriasDespesaController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CategoriaDespesaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] TipoDespesa? tipo, [FromQuery] bool apenasAtivas = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarCategoriasDespesaQuery(tipo, apenasAtivas), ct);
        return Ok(ApiResponse<IReadOnlyList<CategoriaDespesaDto>>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CategoriaDespesaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar([FromBody] CriarCategoriaDespesaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<CategoriaDespesaDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CategoriaDespesaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarCategoriaDespesaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<CategoriaDespesaDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarCategoriaDespesaCommand(id), ct);
        return NoContent();
    }
}
