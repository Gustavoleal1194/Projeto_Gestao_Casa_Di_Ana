using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class Movimentacao
{
    public Guid Id { get; private set; }
    public Guid IngredienteId { get; private set; }
    public TipoMovimentacao Tipo { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal SaldoApos { get; private set; }
    public string? ReferenciaTipo { get; private set; }
    public Guid? ReferenciaId { get; private set; }
    public string? Observacoes { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }

    public Ingrediente? Ingrediente { get; private set; }

    private Movimentacao() { }

    public static Movimentacao Criar(
        Guid ingredienteId,
        TipoMovimentacao tipo,
        decimal quantidade,
        decimal saldoApos,
        Guid criadoPor,
        string? referenciaTipo = null,
        Guid? referenciaId = null,
        string? observacoes = null)
    {
        return new Movimentacao
        {
            Id = Guid.NewGuid(),
            IngredienteId = ingredienteId,
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
