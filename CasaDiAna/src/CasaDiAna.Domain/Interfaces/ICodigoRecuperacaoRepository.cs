using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface ICodigoRecuperacaoRepository
{
    Task AdicionarAsync(IEnumerable<CodigoRecuperacao> codigos, CancellationToken ct = default);
    Task<IReadOnlyList<CodigoRecuperacao>> ObterAtivosPorUsuarioAsync(Guid usuarioId, CancellationToken ct = default);
    Task MarcarUsadoAsync(Guid id, CancellationToken ct = default);
    Task DeletarPorUsuarioAsync(Guid usuarioId, CancellationToken ct = default);
    Task SalvarAsync(CancellationToken ct = default);
}
