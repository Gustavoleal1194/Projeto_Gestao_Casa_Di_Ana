using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IFornecedorRepository
{
    Task<Fornecedor?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Fornecedor>> ListarAsync(bool apenasAtivos = true, CancellationToken ct = default);
    Task<bool> CnpjExisteAsync(string cnpj, Guid? ignorarId = null, CancellationToken ct = default);
    Task AdicionarAsync(Fornecedor fornecedor, CancellationToken ct = default);
    void Atualizar(Fornecedor fornecedor);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
