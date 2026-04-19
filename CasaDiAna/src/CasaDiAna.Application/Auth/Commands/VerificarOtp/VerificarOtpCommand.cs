using CasaDiAna.Application.Auth.Dtos;
using MediatR;

namespace CasaDiAna.Application.Auth.Commands.VerificarOtp;

public record VerificarOtpCommand(Guid UsuarioId, string Codigo) : IRequest<TokenDto>;
