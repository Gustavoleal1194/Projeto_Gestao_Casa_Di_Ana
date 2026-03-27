using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IIngredienteRepository
{
    Task<Ingrediente?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Ingrediente>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> CodigoInternoExisteAsync(string codigo, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(Ingrediente ingrediente, CancellationToken ct = default);
    void Atualizar(Ingrediente ingrediente);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
