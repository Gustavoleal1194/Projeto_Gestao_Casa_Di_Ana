using MediatR;

namespace CasaDiAna.Application.Auth.Commands.ConfirmarSetup2Fa;

public record ConfirmarSetup2FaCommand(
    Guid UsuarioId,
    string Secret,
    string Codigo,
    IReadOnlyList<string> CodigosRecuperacao) : IRequest<Unit>;
