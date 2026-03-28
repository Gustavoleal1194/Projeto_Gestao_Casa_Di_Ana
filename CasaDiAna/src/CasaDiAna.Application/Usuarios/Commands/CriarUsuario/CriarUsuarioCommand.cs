using CasaDiAna.Application.Usuarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.CriarUsuario;

public record CriarUsuarioCommand(
    string Nome,
    string Email,
    string Senha,
    string Papel) : IRequest<UsuarioDto>;
