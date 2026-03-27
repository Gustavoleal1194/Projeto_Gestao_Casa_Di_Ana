using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class ProducaoDiaria
{
    public Guid Id { get; private set; }
    public Guid ProdutoId { get; private set; }
    public DateTime Data { get; private set; }
    public decimal QuantidadeProduzida { get; private set; }
    public decimal CustoTotal { get; private set; }
    public string? Observacoes { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }

    public Produto? Produto { get; private set; }

    private ProducaoDiaria() { }

    public static ProducaoDiaria Criar(
        Guid produtoId,
        DateTime data,
        decimal quantidadeProduzida,
        decimal custoTotal,
        Guid criadoPor,
        string? observacoes = null)
    {
        if (quantidadeProduzida <= 0)
            throw new DomainException("Quantidade produzida deve ser maior que zero.");
        if (custoTotal < 0)
            throw new DomainException("Custo total não pode ser negativo.");

        return new ProducaoDiaria
        {
            Id = Guid.NewGuid(),
            ProdutoId = produtoId,
            Data = data,
            QuantidadeProduzida = quantidadeProduzida,
            CustoTotal = custoTotal,
            Observacoes = observacoes,
            CriadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor
        };
    }
}
