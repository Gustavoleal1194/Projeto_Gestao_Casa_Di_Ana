// src/CasaDiAna.Domain/Interfaces/ICodigoRecuperacaoRepository.cs
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface ICodigoRecuperacaoRepository
{
    Task AdicionarAsync(IEnumerable<CodigoRecuperacao> codigos, CancellationToken ct);
    Task<IReadOnlyList<CodigoRecuperacao>> ObterAtivosPorUsuarioAsync(Guid usuarioId, CancellationToken ct);
    Task MarcarUsadoAsync(Guid id, CancellationToken ct);
    Task DeletarPorUsuarioAsync(Guid usuarioId, CancellationToken ct);
}
