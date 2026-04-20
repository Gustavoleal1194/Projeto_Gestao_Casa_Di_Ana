// src/CasaDiAna.Domain/Interfaces/ITotpService.cs
namespace CasaDiAna.Domain.Interfaces;

public interface ITotpService
{
    string GerarSecret();
    string GerarQrCodeUrl(string secret, string email, string emissor = "Casa di Ana");
    bool ValidarCodigo(string secret, string codigo);
}
