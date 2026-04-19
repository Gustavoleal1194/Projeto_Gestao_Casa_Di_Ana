using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.Desabilitar2Fa;

public record Desabilitar2FaCommand(Guid UsuarioId) : IRequest<Unit>;
