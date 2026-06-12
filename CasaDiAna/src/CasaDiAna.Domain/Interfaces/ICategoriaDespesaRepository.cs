using CasaDiAna.Domain.Enums;
using CategoriaDespesaEntity = CasaDiAna.Domain.Entities.CategoriaDespesa;

namespace CasaDiAna.Domain.Interfaces;

public interface ICategoriaDespesaRepository
{
    Task<CategoriaDespesaEntity?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<CategoriaDespesaEntity>> ListarAsync(TipoDespesa? tipo = null, bool apenasAtivas = true, CancellationToken ct = default);
    Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(CategoriaDespesaEntity categoria, CancellationToken ct = default);
    void Atualizar(CategoriaDespesaEntity categoria);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
