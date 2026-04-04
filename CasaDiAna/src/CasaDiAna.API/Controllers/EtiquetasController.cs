using CasaDiAna.Application.Common;
using CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Application.Etiquetas.Queries.ListarHistorico;
using CasaDiAna.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/etiquetas")]
[Authorize]
public class EtiquetasController : ControllerBase
{
    private readonly IMediator _mediator;

    public EtiquetasController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Registra uma impressão de etiqueta no histórico.
    /// Chamado após o frontend executar o window.print().
    /// </summary>
    [HttpPost("historico")]
    public async Task<IActionResult> RegistrarImpressao(
        [FromBody] RegistrarImpressaoRequest body,
        CancellationToken ct = default)
    {
        var comando = new RegistrarImpressaoCommand(
            body.ProdutoId,
            body.TipoEtiqueta,
            body.Quantidade,
            body.DataProducao);

        var resultado = await _mediator.Send(comando, ct);
        return Ok(ApiResponse<HistoricoImpressaoDto>.Ok(resultado));
    }

    /// <summary>
    /// Lista o histórico de impressões, opcionalmente filtrado por produto.
    /// </summary>
    [HttpGet("historico")]
    public async Task<IActionResult> ListarHistorico(
        [FromQuery] Guid? produtoId = null,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarHistoricoQuery(produtoId), ct);
        return Ok(ApiResponse<IReadOnlyList<HistoricoImpressaoDto>>.Ok(resultado));
    }
}

public record RegistrarImpressaoRequest(
    Guid ProdutoId,
    TipoEtiqueta TipoEtiqueta,
    int Quantidade,
    DateTime DataProducao);
