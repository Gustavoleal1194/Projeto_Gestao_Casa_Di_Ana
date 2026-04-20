namespace CasaDiAna.Application.Auth.Dtos;

public record IniciarSetup2FaResultDto(
    string QrCodeUrl,
    string SecretManual,
    IReadOnlyList<string> CodigosRecuperacao);
