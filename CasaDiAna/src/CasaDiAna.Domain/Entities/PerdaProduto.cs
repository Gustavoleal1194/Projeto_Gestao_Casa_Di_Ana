using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class PerdaProduto
{
    public Guid Id { get; private set; }
    public Guid ProdutoId { get; private set; }
    public DateTime Data { get; private set; }
    public decimal Quantidade { get; private set; }
    public string Justificativa { get; private set; } = string.Empty;
    public DateTime CriadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }

    public Produto? Produto { get; private set; }

    private PerdaProduto() { }

    public static PerdaProduto Criar(
        Guid produtoId,
        DateTime data,
        decimal quantidade,
        string justificativa,
        Guid criadoPor)
    {
        if (quantidade <= 0)
            throw new DomainException("Quantidade perdida deve ser maior que zero.");

        if (string.IsNullOrWhiteSpace(justificativa))
            throw new DomainException("Justificativa é obrigatória.");

        return new PerdaProduto
        {
            Id = Guid.NewGuid(),
            ProdutoId = produtoId,
            Data = data,
            Quantidade = quantidade,
            Justificativa = justificativa.Trim(),
            CriadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor
        };
    }
}
