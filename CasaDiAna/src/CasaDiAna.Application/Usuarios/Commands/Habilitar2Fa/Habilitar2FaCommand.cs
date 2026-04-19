using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.Habilitar2Fa;

public record Habilitar2FaCommand(Guid UsuarioId, string Telefone) : IRequest<Unit>;
