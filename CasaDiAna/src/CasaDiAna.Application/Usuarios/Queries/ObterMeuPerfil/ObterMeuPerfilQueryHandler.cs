using CasaDiAna.Application.Usuarios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Queries.ObterMeuPerfil;

public class ObterMeuPerfilQueryHandler : IRequestHandler<ObterMeuPerfilQuery, MeuPerfilDto>
{
    private readonly IUsuarioRepository _usuarios;

    public ObterMeuPerfilQueryHandler(IUsuarioRepository usuarios) => _usuarios = usuarios;

    public async Task<MeuPerfilDto> Handle(ObterMeuPerfilQuery request, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.ObterPorIdAsync(request.UsuarioId, cancellationToken)
            ?? throw new DomainException("Usuário não encontrado.");

        return new MeuPerfilDto(
            usuario.Nome,
            usuario.Email,
            usuario.Papel.ToString(),
            usuario.TwoFactorHabilitado,
            usuario.UltimoLogin,
            usuario.IpUltimoLogin,
            usuario.UserAgentUltimoLogin,
            usuario.TotalLogins);
    }
}
