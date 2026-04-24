namespace CasaDiAna.Application.Usuarios.Dtos;

public record MeuPerfilDto(
    string Nome,
    string Email,
    string Papel,
    bool TwoFactorHabilitado,
    DateTime? UltimoLogin,
    string? IpUltimoLogin,
    string? UserAgentUltimoLogin,
    int TotalLogins);
