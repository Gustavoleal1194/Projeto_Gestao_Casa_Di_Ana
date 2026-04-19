using CasaDiAna.Application.Auth.Dtos;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.Login;

public record LoginCommand(string Email, string Senha) : IRequest<LoginResultDto>;
