using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface ICategoriaIngredienteRepository
{
    Task<CategoriaIngrediente?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<CategoriaIngrediente>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(CategoriaIngrediente categoria, CancellationToken ct = default);
    void Atualizar(CategoriaIngrediente categoria);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
