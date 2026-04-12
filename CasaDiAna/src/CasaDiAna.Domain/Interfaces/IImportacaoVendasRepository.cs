using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IImportacaoVendasRepository
{
    Task<bool> HashExisteAsync(string hash, CancellationToken ct = default);
    Task AdicionarAsync(ImportacaoVendas importacao, CancellationToken ct = default);
    Task<IReadOnlyList<ImportacaoVendas>> ListarAsync(CancellationToken ct = default);
}
