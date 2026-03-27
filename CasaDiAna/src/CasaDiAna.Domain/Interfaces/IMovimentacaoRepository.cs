using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Interfaces;

public interface IMovimentacaoRepository
{
    Task<IReadOnlyList<Movimentacao>> ListarPorIngredienteAsync(Guid ingredienteId, DateTime? de = null, DateTime? ate = null, CancellationToken ct = default);
    Task<IReadOnlyList<Movimentacao>> ListarAsync(DateTime de, DateTime ate, TipoMovimentacao? tipo = null, CancellationToken ct = default);
    Task AdicionarAsync(Movimentacao movimentacao, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
