namespace CasaDiAna.Domain.Interfaces;

public interface ISmsService
{
    Task EnviarAsync(string telefone, string codigo, CancellationToken ct = default);
}
