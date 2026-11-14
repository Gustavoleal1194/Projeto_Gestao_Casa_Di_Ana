using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Despesa
{
    public Guid Id { get; private set; }
    public DateTime Competencia { get; private set; }
    public Guid CategoriaDespesaId { get; private set; }
    public string? Descricao { get; private set; }
    public decimal Valor { get; private set; }
    public string? Observacao { get; private set; }
    public DateTime DataLancamento { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public CategoriaDespesa? Categoria { get; private set; }

    private Despesa() { }

    public static DateTime NormalizarCompetencia(DateTime data) =>
        new(data.Year, data.Month, 1, 0, 0, 0, DateTimeKind.Utc);

    public static Despesa Criar(
        DateTime competencia, Guid categoriaDespesaId,
        string? descricao, decimal valor, string? observacao, DateTime dataLancamento, Guid criadoPor)
    {
        if (valor <= 0)
            throw new DomainException("Valor da despesa deve ser maior que zero.");

        return new Despesa
        {
            Id = Guid.NewGuid(),
            Competencia = NormalizarCompetencia(competencia),
            CategoriaDespesaId = categoriaDespesaId,
            Descricao = string.IsNullOrWhiteSpace(descricao) ? null : descricao.Trim(),
            Valor = valor,
            Observacao = string.IsNullOrWhiteSpace(observacao) ? null : observacao.Trim(),
            DataLancamento = dataLancamento,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    /// <summary>
    /// Repete esta despesa em outra competência (mesma categoria, descrição, valor e
    /// observação). O dia do lançamento é mantido, limitado ao último dia do mês destino.
    /// </summary>
    public Despesa CopiarPara(DateTime competencia, Guid criadoPor)
    {
        var destino = NormalizarCompetencia(competencia);
        var dia = Math.Min(DataLancamento.Day, DateTime.DaysInMonth(destino.Year, destino.Month));
        var dataLancamento = new DateTime(destino.Year, destino.Month, dia, 0, 0, 0, DateTimeKind.Utc);
        return Criar(destino, CategoriaDespesaId, Descricao, Valor, Observacao, dataLancamento, criadoPor);
    }

    /// <summary>Mesma despesa recorrente: mesma categoria e mesma descrição (sem diferenciar caixa).</summary>
    public bool EhMesmoLancamentoQue(Despesa outra) =>
        CategoriaDespesaId == outra.CategoriaDespesaId &&
        string.Equals(Descricao, outra.Descricao, StringComparison.OrdinalIgnoreCase);

    public void Atualizar(
        DateTime competencia, Guid categoriaDespesaId,
        string? descricao, decimal valor, string? observacao, DateTime dataLancamento, Guid atualizadoPor)
    {
        if (valor <= 0)
            throw new DomainException("Valor da despesa deve ser maior que zero.");

        Competencia = NormalizarCompetencia(competencia);
        CategoriaDespesaId = categoriaDespesaId;
        Descricao = string.IsNullOrWhiteSpace(descricao) ? null : descricao.Trim();
        Valor = valor;
        Observacao = string.IsNullOrWhiteSpace(observacao) ? null : observacao.Trim();
        DataLancamento = dataLancamento;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Cancelar(Guid atualizadoPor)
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
