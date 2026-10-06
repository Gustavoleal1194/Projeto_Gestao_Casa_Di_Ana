namespace CasaDiAna.Domain.Entities;

public class ItemEntradaUtensilio
{
    public Guid Id { get; private set; }
    public Guid EntradaId { get; private set; }
    public Guid UtensilioId { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal CustoUnitario { get; private set; }
    public decimal CustoTotal => Quantidade * CustoUnitario;

    public Utensilio? Utensilio { get; private set; }

    private ItemEntradaUtensilio() { }

    internal static ItemEntradaUtensilio Criar(
        Guid entradaId,
        Guid utensilioId,
        decimal quantidade,
        decimal custoUnitario)
    {
        return new ItemEntradaUtensilio
        {
            Id = Guid.NewGuid(),
            EntradaId = entradaId,
            UtensilioId = utensilioId,
            Quantidade = quantidade,
            CustoUnitario = custoUnitario
        };
    }
}
