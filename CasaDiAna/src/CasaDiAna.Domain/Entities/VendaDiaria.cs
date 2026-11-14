using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class VendaDiaria
{
    public Guid Id { get; private set; }
    public Guid ProdutoId { get; private set; }
    public DateTime Data { get; private set; }
    public decimal QuantidadeVendida { get; private set; }
    /// <summary>
    /// Custo dos insumos baixados na venda (snapshot da época). Só existe para
    /// produtos feitos na hora com ficha técnica; nulo nos demais casos.
    /// </summary>
    public decimal? CustoTotal { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }

    public Produto? Produto { get; private set; }

    private VendaDiaria() { }

    public static VendaDiaria Criar(
        Guid produtoId,
        DateTime data,
        decimal quantidadeVendida,
        Guid criadoPor)
    {
        if (quantidadeVendida <= 0)
            throw new DomainException("Quantidade vendida deve ser maior que zero.");

        return new VendaDiaria
        {
            Id = Guid.NewGuid(),
            ProdutoId = produtoId,
            Data = data,
            QuantidadeVendida = quantidadeVendida,
            CriadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor
        };
    }

    public void RegistrarCustoInsumos(decimal custoTotal)
    {
        if (custoTotal < 0)
            throw new DomainException("Custo dos insumos não pode ser negativo.");
        CustoTotal = custoTotal;
    }
}
