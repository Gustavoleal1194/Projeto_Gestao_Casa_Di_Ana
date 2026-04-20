using CasaDiAna.Application.Auth.Dtos;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.IniciarSetup2Fa;

public record IniciarSetup2FaCommand(Guid UsuarioId) : IRequest<IniciarSetup2FaResultDto>;
