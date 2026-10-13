using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IEntradaMercadoriaRepository
{
    Task<EntradaMercadoria?> ObterPorIdComItensAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<EntradaMercadoria>> ListarAsync(DateTime? de = null, DateTime? ate = null, CancellationToken ct = default);
    Task<IReadOnlyList<EntradaMercadoria>> ListarParaComparacaoAsync(DateTime? de = null, DateTime? ate = null, CancellationToken ct = default);
    Task AdicionarAsync(EntradaMercadoria entrada, CancellationToken ct = default);
    void Atualizar(EntradaMercadoria entrada);
    /// <summary>
    /// Ingredientes da entrada que aparecem em outra entrada confirmada mais recente
    /// (maior DataEntrada; empate decidido pelo maior CriadoEm).
    /// </summary>
    Task<IReadOnlySet<Guid>> ObterIngredientesComEntradaPosteriorAsync(EntradaMercadoria entrada, CancellationToken ct = default);
    /// <summary>Mesmo critério de <see cref="ObterIngredientesComEntradaPosteriorAsync"/>, para utensílios.</summary>
    Task<IReadOnlySet<Guid>> ObterUtensiliosComEntradaPosteriorAsync(EntradaMercadoria entrada, CancellationToken ct = default);
    Task AdicionarBoletosAsync(IEnumerable<BoletoEntrada> boletos, CancellationToken ct = default);
    void RemoverBoletos(IEnumerable<BoletoEntrada> boletos);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
