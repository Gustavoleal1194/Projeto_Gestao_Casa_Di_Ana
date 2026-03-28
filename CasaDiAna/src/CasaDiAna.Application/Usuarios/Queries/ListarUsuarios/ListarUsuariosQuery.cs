using CasaDiAna.Application.Usuarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Queries.ListarUsuarios;

public record ListarUsuariosQuery : IRequest<IReadOnlyList<UsuarioDto>>;
