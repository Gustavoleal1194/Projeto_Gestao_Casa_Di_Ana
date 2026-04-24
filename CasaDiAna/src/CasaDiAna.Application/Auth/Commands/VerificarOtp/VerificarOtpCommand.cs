// src/CasaDiAna.Application/Auth/Commands/VerificarOtp/VerificarOtpCommand.cs
using CasaDiAna.Application.Auth.Dtos;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.VerificarOtp;

public record VerificarOtpCommand(
    Guid UsuarioId,
    string Codigo,
    string? Ip = null,
    string? UserAgent = null) : IRequest<TokenDto>;
