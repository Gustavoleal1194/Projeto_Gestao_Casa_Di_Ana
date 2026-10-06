using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class MovimentacaoUtensilio
{
    public Guid Id { get; private set; }
    public Guid UtensilioId { get; private set; }
    public TipoMovimentacao Tipo { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal SaldoApos { get; private set; }
    public string? ReferenciaTipo { get; private set; }
    public Guid? ReferenciaId { get; private set; }
    public string? Observacoes { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }

    public Utensilio? Utensilio { get; private set; }

    private MovimentacaoUtensilio() { }

    public static MovimentacaoUtensilio Criar(
        Guid utensilioId,
        TipoMovimentacao tipo,
        decimal quantidade,
        decimal saldoApos,
        Guid criadoPor,
        string? referenciaTipo = null,
        Guid? referenciaId = null,
        string? observacoes = null)
    {
        return new MovimentacaoUtensilio
        {
            Id = Guid.NewGuid(),
            UtensilioId = utensilioId,
            Tipo = tipo,
            Quantidade = quantidade,
            SaldoApos = saldoApos,
            CriadoPor = criadoPor,
            ReferenciaTipo = referenciaTipo,
            ReferenciaId = referenciaId,
            Observacoes = observacoes,
            CriadoEm = DateTime.UtcNow
        };
    }
}
