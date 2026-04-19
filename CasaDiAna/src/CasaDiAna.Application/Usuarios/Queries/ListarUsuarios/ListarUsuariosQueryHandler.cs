using CasaDiAna.Application.Usuarios.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Queries.ListarUsuarios;

public class ListarUsuariosQueryHandler : IRequestHandler<ListarUsuariosQuery, IReadOnlyList<UsuarioDto>>
{
    private readonly IUsuarioRepository _usuarios;

    public ListarUsuariosQueryHandler(IUsuarioRepository usuarios) => _usuarios = usuarios;

    public async Task<IReadOnlyList<UsuarioDto>> Handle(ListarUsuariosQuery request, CancellationToken ct)
    {
        var lista = await _usuarios.ListarAsync(ct);
        return lista.Select(ToDto).ToList();
    }

    internal static UsuarioDto ToDto(Usuario u) => new(
        u.Id,
        u.Nome,
        u.Email,
        u.Papel.ToString(),
        u.Ativo,
        u.CriadoEm,
        u.TwoFactorHabilitado,
        u.Telefone is null ? null : Usuario.MascararTelefone(u.Telefone));
}
