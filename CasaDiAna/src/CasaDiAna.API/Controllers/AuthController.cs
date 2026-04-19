using CasaDiAna.Application.Auth.Commands.Login;
using CasaDiAna.Application.Auth.Commands.ReenviarCodigo;
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

    /// <summary>Realiza login. Se 2FA estiver ativo, retorna tokenTemporario em vez do JWT definitivo.</summary>
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command, ct);
        return Ok(ApiResponse<LoginResultDto>.Ok(resultado));
    }

    /// <summary>Valida o OTP enviado por SMS e emite o JWT definitivo.</summary>
    [HttpPost("verificar-2fa")]
    [Authorize(Policy = "Pre2Fa")]
    [ProducesResponseType(typeof(ApiResponse<TokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerificarOtp(
        [FromBody] VerificarOtpRequest request, CancellationToken ct)
    {
        var usuarioId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var token = await _mediator.Send(
            new VerificarOtpCommand(usuarioId, request.Codigo), ct);
        return Ok(ApiResponse<TokenDto>.Ok(token));
    }

    /// <summary>Reenvia o código OTP por SMS.</summary>
    [HttpPost("reenviar-codigo")]
    [Authorize(Policy = "Pre2Fa")]
    [EnableRateLimiting("reenvio2fa")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> ReenviarCodigo(CancellationToken ct)
    {
        var usuarioId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _mediator.Send(new ReenviarCodigoCommand(usuarioId), ct);
        return Ok(ApiResponse<object>.Ok(null!));
    }
}

public record VerificarOtpRequest(string Codigo);
