namespace CasaDiAna.Domain.Entities;

public class BoletoEntrada
{
    public Guid Id { get; private set; }
    public Guid EntradaId { get; private set; }
    public DateTime DataVencimento { get; private set; }

    private BoletoEntrada() { }

    internal static BoletoEntrada Criar(Guid entradaId, DateTime dataVencimento)
    {
        return new BoletoEntrada
        {
            Id = Guid.NewGuid(),
            EntradaId = entradaId,
            DataVencimento = dataVencimento
        };
    }
}
