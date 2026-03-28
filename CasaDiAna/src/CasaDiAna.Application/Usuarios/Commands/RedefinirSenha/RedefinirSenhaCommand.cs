using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.RedefinirSenha;

public record RedefinirSenhaCommand(Guid Id, string NovaSenha) : IRequest;
