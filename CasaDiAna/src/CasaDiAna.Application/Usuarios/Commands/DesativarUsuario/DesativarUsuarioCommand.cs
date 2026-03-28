using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.DesativarUsuario;

public record DesativarUsuarioCommand(Guid Id) : IRequest;
