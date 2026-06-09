using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Domain.Interfaces;

public interface IFaturamentoMensalRepository
{
    Task<FaturamentoMensal?> ObterPorCompetenciaAsync(DateTime competencia, CancellationToken ct = default);
    Task AdicionarAsync(FaturamentoMensal faturamento, CancellationToken ct = default);
    void Atualizar(FaturamentoMensal faturamento);
    Task<int> SalvarAsync(CancellationToken ct = default);
}
