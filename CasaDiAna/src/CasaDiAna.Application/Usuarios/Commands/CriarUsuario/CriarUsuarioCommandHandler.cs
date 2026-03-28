using CasaDiAna.Application.Usuarios.Dtos;
using CasaDiAna.Application.Usuarios.Queries.ListarUsuarios;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Usuarios.Commands.CriarUsuario;

public class CriarUsuarioCommandHandler : IRequestHandler<CriarUsuarioCommand, UsuarioDto>
{
    private readonly IUsuarioRepository _usuarios;

    public CriarUsuarioCommandHandler(IUsuarioRepository usuarios) => _usuarios = usuarios;

    public async Task<UsuarioDto> Handle(CriarUsuarioCommand request, CancellationToken ct)
    {
        if (await _usuarios.EmailExisteAsync(request.Email, ct: ct))
            throw new DomainException($"Já existe um usuário com o e-mail '{request.Email}'.");

        var papel = Enum.Parse<PapelUsuario>(request.Papel);
        var senhaHash = Usuario.HashSenha(request.Senha);
        var usuario = Usuario.Criar(request.Nome, request.Email, senhaHash, papel);

        await _usuarios.AdicionarAsync(usuario, ct);
        await _usuarios.SalvarAsync(ct);

        return ListarUsuariosQueryHandler.ToDto(usuario);
    }
}
