using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IProdutoRepository
{
    Task<Produto?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<Produto?> ObterPorIdComFichaAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Produto>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(Produto produto, CancellationToken ct = default);
    void Atualizar(Produto produto);
    Task SubstituirItensFichaAsync(Produto produto, CancellationToken ct = default);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
