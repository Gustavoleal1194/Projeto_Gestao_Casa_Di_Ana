using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface ICategoriaProdutoRepository
{
    Task<CategoriaProduto?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<CategoriaProduto>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> NomeExisteAsync(string nome, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(CategoriaProduto categoria, CancellationToken ct = default);
    void Atualizar(CategoriaProduto categoria);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
