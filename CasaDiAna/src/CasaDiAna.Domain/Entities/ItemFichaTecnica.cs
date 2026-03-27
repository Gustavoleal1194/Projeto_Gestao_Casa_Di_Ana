using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class ItemFichaTecnica
{
    public Guid Id { get; private set; }
    public Guid ProdutoId { get; private set; }
    public Guid IngredienteId { get; private set; }
    public decimal QuantidadePorUnidade { get; private set; }

    public Ingrediente? Ingrediente { get; private set; }

    private ItemFichaTecnica() { }

    internal static ItemFichaTecnica Criar(Guid produtoId, Guid ingredienteId, decimal quantidadePorUnidade)
    {
        if (quantidadePorUnidade <= 0)
            throw new DomainException("Quantidade por unidade deve ser maior que zero.");

        return new ItemFichaTecnica
        {
            Id = Guid.NewGuid(),
            ProdutoId = produtoId,
            IngredienteId = ingredienteId,
            QuantidadePorUnidade = quantidadePorUnidade
        };
    }
}
