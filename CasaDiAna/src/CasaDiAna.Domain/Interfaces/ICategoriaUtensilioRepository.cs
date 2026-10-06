using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface ICategoriaUtensilioRepository
{
    Task<CategoriaUtensilio?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<CategoriaUtensilio>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(CategoriaUtensilio categoria, CancellationToken ct = default);
    void Atualizar(CategoriaUtensilio categoria);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
