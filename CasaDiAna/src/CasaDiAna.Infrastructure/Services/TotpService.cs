// src/CasaDiAna.Infrastructure/Services/TotpService.cs
using CasaDiAna.Domain.Interfaces;
using OtpNet;

namespace CasaDiAna.Infrastructure.Services;

public class TotpService : ITotpService
{
    public string GerarSecret()
    {
        var key = KeyGeneration.GenerateRandomKey(20);
        return Base32Encoding.ToString(key);
    }

    public string GerarQrCodeUrl(string secret, string email, string emissor = "Casa di Ana")
    {
        var emissorEncoded = Uri.EscapeDataString(emissor);
        var emailEncoded   = Uri.EscapeDataString(email);
        var secretClean    = secret.Replace(" ", "").ToUpperInvariant();
        return $"otpauth://totp/{emissorEncoded}:{emailEncoded}?secret={secretClean}&issuer={emissorEncoded}&algorithm=SHA1&digits=6&period=30";
    }

    public bool ValidarCodigo(string secret, string codigo)
    {
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(codigo))
            return false;

        byte[] secretBytes;
        try
        {
            secretBytes = Base32Encoding.ToBytes(secret);
        }
        catch (ArgumentException)
        {
            return false;
        }

        var totp = new Totp(secretBytes);
        return totp.VerifyTotp(codigo.Trim(), out _, new VerificationWindow(1, 1));
    }
}
