namespace CasaDiAna.Application.Auth.Dtos;

public record LoginResultDto(
    bool Requer2Fa,
    string? TokenTemporario,
    string? Token,
    string? Nome,
    string? Papel,
    string? TelefoneMascarado);
