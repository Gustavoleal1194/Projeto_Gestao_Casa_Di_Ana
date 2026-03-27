using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IUnidadeMedidaRepository
{
    Task<IReadOnlyList<UnidadeMedida>> ListarAsync(CancellationToken ct = default);
    Task<bool> ExisteAsync(short id, CancellationToken ct = default);
}
