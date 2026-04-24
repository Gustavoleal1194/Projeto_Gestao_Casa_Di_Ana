// src/CasaDiAna.Application/Auth/Commands/Login/LoginCommand.cs
using CasaDiAna.Application.Auth.Dtos;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.Login;

public record LoginCommand(
    string Email,
    string Senha,
    string? Ip = null,
    string? UserAgent = null) : IRequest<LoginResultDto>;
