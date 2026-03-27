namespace CasaDiAna.Domain.Entities;

public class ItemInventario
{
    public Guid Id { get; private set; }
    public Guid InventarioId { get; private set; }
    public Guid IngredienteId { get; private set; }
    public decimal QuantidadeSistema { get; private set; }
    public decimal QuantidadeContada { get; private set; }
    public decimal Diferenca => QuantidadeContada - QuantidadeSistema;
    public string? Observacoes { get; private set; }

    public Ingrediente? Ingrediente { get; private set; }

    private ItemInventario() { }

    internal static ItemInventario Criar(
        Guid inventarioId,
        Guid ingredienteId,
        decimal quantidadeSistema,
        decimal quantidadeContada,
        string? observacoes = null)
    {
        return new ItemInventario
        {
            Id = Guid.NewGuid(),
            InventarioId = inventarioId,
            IngredienteId = ingredienteId,
            QuantidadeSistema = quantidadeSistema,
            QuantidadeContada = quantidadeContada,
            Observacoes = observacoes
        };
    }
}
