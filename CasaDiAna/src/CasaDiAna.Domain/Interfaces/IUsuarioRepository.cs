using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken ct = default);
    Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task AdicionarAsync(Usuario usuario, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
