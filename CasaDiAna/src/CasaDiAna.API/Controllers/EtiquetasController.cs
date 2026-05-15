using CasaDiAna.Application.Common;
using CasaDiAna.Application.Etiquetas.Commands.ExcluirModeloNutricional;
using CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;
using CasaDiAna.Application.Etiquetas.Commands.RenomearModeloNutricional;
using CasaDiAna.Application.Etiquetas.Commands.SalvarModeloNutricional;
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Application.Etiquetas.Queries.ListarHistorico;
using CasaDiAna.Application.Etiquetas.Queries.ListarModelosNutricionais;
using CasaDiAna.Application.Etiquetas.Queries.ObterModeloNutricional;
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

    [HttpGet("modelos-nutricionais")]
    public async Task<IActionResult> ListarModelosNutricionais(CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ListarModelosNutricionaisQuery(), ct);
        return Ok(ApiResponse<IReadOnlyList<ModeloNutricionalResumoDto>>.Ok(resultado));
    }

    [HttpGet("modelos-nutricionais/{produtoId:guid}")]
    public async Task<IActionResult> ObterModeloNutricional(Guid produtoId, CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(new ObterModeloNutricionalQuery(produtoId), ct);
        return Ok(ApiResponse<ModeloEtiquetaNutricionalDto?>.Ok(resultado));
    }

    [HttpPatch("modelos-nutricionais/{produtoId:guid}/nome")]
    public async Task<IActionResult> RenomearModeloNutricional(
        Guid produtoId,
        [FromBody] RenomearModeloNutricionalRequest body,
        CancellationToken ct = default)
    {
        var resultado = await _mediator.Send(
            new RenomearModeloNutricionalCommand(produtoId, body.Nome), ct);
        return Ok(ApiResponse<ModeloEtiquetaNutricionalDto>.Ok(resultado));
    }

    [HttpDelete("modelos-nutricionais/{produtoId:guid}")]
    public async Task<IActionResult> ExcluirModeloNutricional(Guid produtoId, CancellationToken ct = default)
    {
        await _mediator.Send(new ExcluirModeloNutricionalCommand(produtoId), ct);
        return NoContent();
    }

    [HttpPut("modelos-nutricionais/{produtoId:guid}")]
    public async Task<IActionResult> SalvarModeloNutricional(
        Guid produtoId,
        [FromBody] SalvarModeloNutricionalRequest body,
        CancellationToken ct = default)
    {
        var command = new SalvarModeloNutricionalCommand(
            produtoId,
            body.Porcao,
            body.ValorEnergeticoKcal,
            body.ValorEnergeticoKJ,
            body.Carboidratos,
            body.AcucaresTotais,
            body.AcucaresAdicionados,
            body.Proteinas,
            body.GordurasTotais,
            body.GordurasSaturadas,
            body.GordurasTrans,
            body.FibraAlimentar,
            body.Sodio,
            body.PorcoesPorEmbalagem,
            body.MedidaCaseira,
            body.VdValorEnergetico,
            body.VdCarboidratos,
            body.VdAcucaresAdicionados,
            body.VdProteinas,
            body.VdGordurasTotais,
            body.VdGordurasSaturadas,
            body.VdGordurasTrans,
            body.VdFibraAlimentar,
            body.VdSodio,
            body.Nome,
            body.ContemAlergicos,
            body.ContemGluten,
            body.ContemLactose,
            body.LoteFabricacao,
            body.Ingredientes);

        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<ModeloEtiquetaNutricionalDto>.Ok(resultado));
    }
}

public record RegistrarImpressaoRequest(
    Guid ProdutoId,
    TipoEtiqueta TipoEtiqueta,
    int Quantidade,
    DateTime DataProducao);

public record SalvarModeloNutricionalRequest(
    string Porcao,
    decimal ValorEnergeticoKcal,
    decimal ValorEnergeticoKJ,
    decimal Carboidratos,
    decimal AcucaresTotais,
    decimal AcucaresAdicionados,
    decimal Proteinas,
    decimal GordurasTotais,
    decimal GordurasSaturadas,
    decimal GordurasTrans,
    decimal FibraAlimentar,
    decimal Sodio,
    int? PorcoesPorEmbalagem,
    string? MedidaCaseira,
    string? VdValorEnergetico,
    string? VdCarboidratos,
    string? VdAcucaresAdicionados,
    string? VdProteinas,
    string? VdGordurasTotais,
    string? VdGordurasSaturadas,
    string? VdGordurasTrans,
    string? VdFibraAlimentar,
    string? VdSodio,
    string? Nome,
    bool ContemAlergicos,
    bool ContemGluten,
    bool ContemLactose,
    string? LoteFabricacao,
    string? Ingredientes);

public record RenomearModeloNutricionalRequest(string? Nome);
