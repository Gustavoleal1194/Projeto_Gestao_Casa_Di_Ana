using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IUtensilioRepository
{
    Task<Utensilio?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Utensilio>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> CodigoInternoExisteAsync(string codigo, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(Utensilio utensilio, CancellationToken ct = default);
    void Atualizar(Utensilio utensilio);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
