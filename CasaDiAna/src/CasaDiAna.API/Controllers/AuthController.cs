using CasaDiAna.Application.Auth.Commands.ConfirmarSetup2Fa;
using CasaDiAna.Application.Auth.Commands.IniciarSetup2Fa;
using CasaDiAna.Application.Auth.Commands.Login;
using CasaDiAna.Application.Auth.Commands.VerificarOtp;
using CasaDiAna.Application.Auth.Dtos;
using CasaDiAna.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace CasaDiAna.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<LoginResultDto>.Ok(resultado));
    }

    [HttpPost("verificar-2fa")]
    [Authorize(Policy = "Pre2Fa")]
    [ProducesResponseType(typeof(ApiResponse<TokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerificarOtp(
        [FromBody] VerificarOtpRequest request, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var token = await _mediator.Send(new VerificarOtpCommand(usuarioId, request.Codigo), ct);
        return Ok(ApiResponse<TokenDto>.Ok(token));
    }

    [HttpPost("iniciar-setup-2fa")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IniciarSetup2FaResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> IniciarSetup2Fa(CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var resultado = await _mediator.Send(new IniciarSetup2FaCommand(usuarioId), ct);
        return Ok(ApiResponse<IniciarSetup2FaResultDto>.Ok(resultado));
    }

    [HttpPost("confirmar-setup-2fa")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ConfirmarSetup2Fa(
        [FromBody] ConfirmarSetup2FaRequest request, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _mediator.Send(
            new ConfirmarSetup2FaCommand(usuarioId, request.Secret, request.Codigo, request.CodigosRecuperacao), ct);
        return Ok(ApiResponse<object>.Ok(null!));
    }
}

public record VerificarOtpRequest(string Codigo);
public record ConfirmarSetup2FaRequest(
    string Secret,
    string Codigo,
    IReadOnlyList<string> CodigosRecuperacao);
