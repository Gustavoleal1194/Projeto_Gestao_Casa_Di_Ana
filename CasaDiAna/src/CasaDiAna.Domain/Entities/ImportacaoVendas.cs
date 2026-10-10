using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class ImportacaoVendas
{
    public Guid Id { get; private set; }
    public string NomeArquivo { get; private set; } = string.Empty;
    public string HashConteudo { get; private set; } = string.Empty;
    public DateTime CriadoEm { get; private set; }
    public string? PeriodoDe { get; private set; }
    public string? PeriodoAte { get; private set; }
    public int TotalLinhasParseadas { get; private set; }
    public int TotalImportadas { get; private set; }
    public int TotalIgnoradas { get; private set; }
    public int TotalNaoEncontradas { get; private set; }
    public DateTime? DataVenda { get; private set; }
    public decimal TotalTaxaServico { get; private set; }
    public decimal TotalEntregas { get; private set; }
    public decimal PercentualRetencaoCasa { get; private set; }
    public decimal PercentualTaxaCartao { get; private set; }
    public Guid CriadoPor { get; private set; }

    /// <summary>Parte da taxa de serviço repassada à equipe (percentuais do snapshot).</summary>
    public decimal RepasseEquipe => Math.Round(
        TotalTaxaServico * (1 - PercentualRetencaoCasa - PercentualTaxaCartao),
        2, MidpointRounding.AwayFromZero);

    /// <summary>Entregas são repassadas integralmente aos motoboys.</summary>
    public decimal RepasseMotoboys => TotalEntregas;

    private ImportacaoVendas() { }

    public static ImportacaoVendas Criar(
        string nomeArquivo,
        string hashConteudo,
        string? periodoDe,
        string? periodoAte,
        int totalLinhas,
        int totalImportadas,
        int totalIgnoradas,
        int totalNaoEncontradas,
        DateTime dataVenda,
        decimal totalTaxaServico,
        decimal totalEntregas,
        ConfiguracaoRepasse configuracaoRepasse,
        Guid criadoPor)
    {
        if (totalTaxaServico < 0)
            throw new DomainException("Total de taxa de serviço não pode ser negativo.");
        if (totalEntregas < 0)
            throw new DomainException("Total de entregas não pode ser negativo.");

        return new ImportacaoVendas
        {
            Id = Guid.NewGuid(),
            NomeArquivo = nomeArquivo,
            HashConteudo = hashConteudo,
            CriadoEm = DateTime.UtcNow,
            PeriodoDe = periodoDe,
            PeriodoAte = periodoAte,
            TotalLinhasParseadas = totalLinhas,
            TotalImportadas = totalImportadas,
            TotalIgnoradas = totalIgnoradas,
            TotalNaoEncontradas = totalNaoEncontradas,
            DataVenda = dataVenda,
            TotalTaxaServico = totalTaxaServico,
            TotalEntregas = totalEntregas,
            PercentualRetencaoCasa = configuracaoRepasse.PercentualRetencaoCasa,
            PercentualTaxaCartao = configuracaoRepasse.PercentualTaxaCartao,
            CriadoPor = criadoPor
        };
    }
}
