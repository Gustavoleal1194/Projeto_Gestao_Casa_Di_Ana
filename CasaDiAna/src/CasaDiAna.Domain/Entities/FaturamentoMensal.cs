using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class FaturamentoMensal
{
    public Guid Id { get; private set; }
    public DateTime Competencia { get; private set; }
    public decimal? ValorManual { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private FaturamentoMensal() { }

    public static FaturamentoMensal Criar(DateTime competencia, decimal? valorManual, Guid criadoPor)
    {
        if (valorManual is <= 0)
            throw new DomainException("Faturamento manual deve ser maior que zero.");

        return new FaturamentoMensal
        {
            Id = Guid.NewGuid(),
            Competencia = DespesaFixa.NormalizarCompetencia(competencia),
            ValorManual = valorManual,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void DefinirValor(decimal? valorManual, Guid atualizadoPor)
    {
        if (valorManual is <= 0)
            throw new DomainException("Faturamento manual deve ser maior que zero.");

        ValorManual = valorManual;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
