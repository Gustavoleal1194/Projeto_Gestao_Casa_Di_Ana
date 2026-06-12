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
