using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

/// <summary>
/// Percentuais usados para calcular o repasse da taxa de serviço à equipe.
/// Ambos incidem sobre o valor total da taxa: equipe = taxa × (1 − retenção − cartão).
/// </summary>
public class ConfiguracaoRepasse
{
    public const decimal RetencaoCasaPadrao = 0.25m;
    public const decimal TaxaCartaoPadrao = 0.03m;

    public Guid Id { get; private set; }
    public decimal PercentualRetencaoCasa { get; private set; }
    public decimal PercentualTaxaCartao { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private ConfiguracaoRepasse() { }

    public static ConfiguracaoRepasse Padrao(Guid criadoPor) => new()
    {
        Id = Guid.NewGuid(),
        PercentualRetencaoCasa = RetencaoCasaPadrao,
        PercentualTaxaCartao = TaxaCartaoPadrao,
        AtualizadoEm = DateTime.UtcNow,
        AtualizadoPor = criadoPor
    };

    public void Atualizar(decimal percentualRetencaoCasa, decimal percentualTaxaCartao, Guid atualizadoPor)
    {
        ValidarFracao(percentualRetencaoCasa, "Retenção da casa");
        ValidarFracao(percentualTaxaCartao, "Taxa do cartão");
        if (percentualRetencaoCasa + percentualTaxaCartao >= 1)
            throw new DomainException("A soma da retenção da casa com a taxa do cartão deve ser menor que 100%.");

        PercentualRetencaoCasa = percentualRetencaoCasa;
        PercentualTaxaCartao = percentualTaxaCartao;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    private static void ValidarFracao(decimal valor, string campo)
    {
        if (valor < 0 || valor >= 1)
            throw new DomainException($"{campo} deve estar entre 0% e 100% (exclusivo no topo).");
    }
}
