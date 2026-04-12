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
    public Guid CriadoPor { get; private set; }

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
        Guid criadoPor)
    {
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
            CriadoPor = criadoPor
        };
    }
}
