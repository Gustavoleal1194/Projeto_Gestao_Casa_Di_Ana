using MediatR;

namespace CasaDiAna.Application.Auth.Commands.ReenviarCodigo;

public record ReenviarCodigoCommand(Guid UsuarioId) : IRequest<Unit>;
