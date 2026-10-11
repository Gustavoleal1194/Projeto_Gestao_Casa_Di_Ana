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
    public async Task<IActionResult> Preview(IFormFile arquivo, CancellationToken ct)
    {
        var (erro, bytes) = await LerCsvAsync(arquivo, ct);
        if (erro != null) return erro;

        var command = new ProcessarPreviewVendasCommand(bytes, arquivo.FileName);
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<PreviewImportacaoDto>.Ok(resultado));
    }

    [HttpPost("confirmar")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<ResultadoImportacaoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    [RequestFormLimits(ValueCountLimit = LimiteCamposConfirmacao)]
    public async Task<IActionResult> Confirmar(
        [FromForm] ConfirmarImportacaoForm? form,
        CancellationToken ct)
    {
        if (form is null || !ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Erro("Requisição inválida."));

        var (erro, bytes) = await LerCsvAsync(form.Arquivo, ct);
        if (erro != null) return erro;

        var command = new ConfirmarImportacaoCommand(
            bytes, form.Arquivo!.FileName, form.DataVenda, form.Vinculos, form.LinhasRemovidas);
        var resultado = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ResultadoImportacaoDto>.Ok(resultado));
    }

    private const long TamanhoMaximoArquivo = 10 * 1024 * 1024;

    // Cada vínculo ocupa 2 campos do form; o padrão do ASP.NET (1024) cortaria ~500 vínculos.
    private const int LimiteCamposConfirmacao = 10_000;

    /// <summary>Valida e lê o CSV enviado; devolve o erro 400 ou os bytes.</summary>
    private static async Task<(IActionResult? Erro, byte[] Bytes)> LerCsvAsync(
        IFormFile? arquivo, CancellationToken ct)
    {
        if (arquivo == null || arquivo.Length == 0)
            return (new BadRequestObjectResult(ApiResponse<object>.Erro("Nenhum arquivo enviado.")), []);

        if (!arquivo.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return (new BadRequestObjectResult(ApiResponse<object>.Erro("Somente arquivos CSV são aceitos.")), []);

        if (arquivo.Length > TamanhoMaximoArquivo)
            return (new BadRequestObjectResult(ApiResponse<object>.Erro("Arquivo muito grande. Máximo: 10 MB.")), []);

        await using var ms = new MemoryStream();
        await arquivo.CopyToAsync(ms, ct);
        return (null, ms.ToArray());
    }
}
