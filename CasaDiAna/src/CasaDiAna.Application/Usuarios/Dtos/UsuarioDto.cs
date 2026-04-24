namespace CasaDiAna.Application.Usuarios.Dtos;

public record UsuarioDto(
    Guid Id,
    string Nome,
    string Email,
    string Papel,
    bool Ativo,
    DateTime CriadoEm,
    bool TwoFactorHabilitado,
    DateTime? UltimoLogin);
