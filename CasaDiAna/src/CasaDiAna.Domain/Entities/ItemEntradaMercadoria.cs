namespace CasaDiAna.Domain.Entities;

public class ItemEntradaMercadoria
{
    public Guid Id { get; private set; }
    public Guid EntradaId { get; private set; }
    public Guid IngredienteId { get; private set; }
    public decimal Quantidade { get; private set; }
    public decimal CustoUnitario { get; private set; }
    public decimal CustoTotal => Quantidade * CustoUnitario;

    public Ingrediente? Ingrediente { get; private set; }

    private ItemEntradaMercadoria() { }

    internal static ItemEntradaMercadoria Criar(
        Guid entradaId,
        Guid ingredienteId,
        decimal quantidade,
        decimal custoUnitario)
    {
        return new ItemEntradaMercadoria
        {
            Id = Guid.NewGuid(),
            EntradaId = entradaId,
            IngredienteId = ingredienteId,
            Quantidade = quantidade,
            CustoUnitario = custoUnitario
        };
    }
}
