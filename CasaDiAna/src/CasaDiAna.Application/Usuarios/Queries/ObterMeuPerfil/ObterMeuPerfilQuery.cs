using CasaDiAna.Application.Usuarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Queries.ObterMeuPerfil;

public record ObterMeuPerfilQuery(Guid UsuarioId) : IRequest<MeuPerfilDto>;
