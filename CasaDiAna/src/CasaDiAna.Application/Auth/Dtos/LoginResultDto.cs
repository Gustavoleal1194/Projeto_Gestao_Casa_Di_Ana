namespace CasaDiAna.Application.Auth.Dtos;

public record LoginResultDto(
    bool Requer2Fa,
    string? Token,
    string? Nome,
    string? Papel,
    string? TokenTemporario,
    string? TelefoneMascarado);
