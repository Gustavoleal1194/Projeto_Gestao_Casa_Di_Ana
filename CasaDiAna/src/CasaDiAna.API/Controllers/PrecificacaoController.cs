using CasaDiAna.Application.Common;
using CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;
using CasaDiAna.Application.Precificacao.Dtos;
using CasaDiAna.Application.Precificacao.Queries.ObterAnalise;
using CasaDiAna.Application.Precificacao.Queries.ObterConfiguracao;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/precificacao")]
[Authorize(Roles = "Admin,Coordenador")]
public class PrecificacaoController : ControllerBase
{
    private readonly IMediator _mediator;

    public PrecificacaoController(IMediator mediator) => _mediator = mediator;

    [HttpGet("configuracao")]
    [ProducesResponseType(typeof(ApiResponse<ConfiguracaoPrecificacaoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObterConfiguracao(CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterConfiguracaoPrecificacaoQuery(), ct);
        return Ok(ApiResponse<ConfiguracaoPrecificacaoDto>.Ok(resultado));
    }

    [HttpPut("configuracao")]
    [ProducesResponseType(typeof(ApiResponse<ConfiguracaoPrecificacaoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AtualizarConfiguracao(
        [FromBody] AtualizarConfiguracaoPrecificacaoCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<ConfiguracaoPrecificacaoDto>.Ok(resultado));
    }

    [HttpGet("analise")]
    [ProducesResponseType(typeof(ApiResponse<AnalisePrecificacaoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObterAnalise([FromQuery] DateTime competencia, CancellationToken ct)
    {
        var resultado = await _mediator.Send(new ObterAnalisePrecificacaoQuery(competencia), ct);
        return Ok(ApiResponse<AnalisePrecificacaoDto>.Ok(resultado));
    }
}
