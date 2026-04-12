using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;
using CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/importacao-vendas")]
[Authorize]
public class ImportacaoVendasController : ControllerBase
{
    private readonly IMediator _mediator;

    public ImportacaoVendasController(IMediator mediator) => _mediator = mediator;

    [HttpPost("preview")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<PreviewImportacaoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Preview(
        IFormFile arquivo,
        CancellationToken ct)
    {
        if (arquivo == null || arquivo.Length == 0)
            return BadRequest(ApiResponse<object>.Erro("Nenhum arquivo enviado."));

        if (!arquivo.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiResponse<object>.Erro("Somente arquivos PDF são aceitos."));

        if (arquivo.Length > 10 * 1024 * 1024)
            return BadRequest(ApiResponse<object>.Erro("Arquivo muito grande. Máximo: 10 MB."));

        await using var ms = new MemoryStream();
        await arquivo.CopyToAsync(ms, ct);

        var command = new ProcessarPreviewPdfVendasCommand(ms.ToArray(), arquivo.FileName);
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<PreviewImportacaoDto>.Ok(resultado));
    }

    [HttpPost("confirmar")]
    [ProducesResponseType(typeof(ApiResponse<ResultadoImportacaoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Confirmar(
        [FromBody] ConfirmarImportacaoCommand command,
        CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ResultadoImportacaoDto>.Ok(resultado));
    }
}
