using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IMovimentacaoUtensilioRepository
{
    Task AdicionarAsync(MovimentacaoUtensilio movimentacao, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
