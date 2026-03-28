using CasaDiAna.Application.Common;
using CasaDiAna.Application.Produtos.Commands.AtualizarProduto;
using CasaDiAna.Application.Produtos.Commands.CriarProduto;
using CasaDiAna.Application.Produtos.Commands.DesativarProduto;
using CasaDiAna.Application.Produtos.Commands.DefinirFichaTecnica;
using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Application.Produtos.Queries.ListarProdutos;
using CasaDiAna.Application.Produtos.Queries.ObterFichaTecnica;
using CasaDiAna.Application.Produtos.Queries.ObterProduto;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/produtos")]
[Authorize]
public class ProdutosController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProdutosController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ProdutoResumoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] bool apenasAtivos = true, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarProdutosQuery(apenasAtivos), ct);
        return Ok(ApiResponse<IReadOnlyList<ProdutoResumoDto>>.Ok(resultado));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ProdutoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ObterPorId(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterProdutoQuery(id), ct);
        return Ok(ApiResponse<ProdutoDto>.Ok(resultado));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ProdutoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar([FromBody] CriarProdutoCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(ObterPorId), new { id = resultado.Id },
            ApiResponse<ProdutoDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ProdutoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Atualizar(
        Guid id, [FromBody] AtualizarProdutoCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { Id = id }, ct);
        return Ok(ApiResponse<ProdutoDto>.Ok(resultado));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Desativar(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DesativarProdutoCommand(id), ct);
        return NoContent();
    }

    // ── Ficha Técnica ──────────────────────────────────────────────────────

    [HttpGet("{id:guid}/ficha-tecnica")]
    [ProducesResponseType(typeof(ApiResponse<FichaTecnicaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ObterFichaTecnica(Guid id, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterFichaTecnicaQuery(id), ct);
        return Ok(ApiResponse<FichaTecnicaDto>.Ok(resultado));
    }

    [HttpPut("{id:guid}/ficha-tecnica")]
    [ProducesResponseType(typeof(ApiResponse<FichaTecnicaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> DefinirFichaTecnica(
        Guid id, [FromBody] DefinirFichaTecnicaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { ProdutoId = id }, ct);
        return Ok(ApiResponse<FichaTecnicaDto>.Ok(resultado));
    }
}
