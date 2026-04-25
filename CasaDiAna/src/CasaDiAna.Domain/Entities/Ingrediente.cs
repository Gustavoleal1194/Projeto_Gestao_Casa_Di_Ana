using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Ingrediente
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string? CodigoInterno { get; private set; }
    public Guid? CategoriaId { get; private set; }
    public short UnidadeMedidaId { get; private set; }
    public decimal EstoqueAtual { get; private set; }
    public decimal EstoqueMinimo { get; private set; }
    public decimal? EstoqueMaximo { get; private set; }
    public string? Observacoes { get; private set; }
    public decimal? CustoUnitario { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public UnidadeMedida? UnidadeMedida { get; private set; }
    public CategoriaIngrediente? Categoria { get; private set; }

    private Ingrediente() { }

    public static Ingrediente Criar(
        string nome,
        short unidadeMedidaId,
        decimal estoqueMinimo,
        Guid criadoPor,
        string? codigoInterno = null,
        Guid? categoriaId = null,
        decimal? estoqueMaximo = null,
        string? observacoes = null)
    {
        if (estoqueMinimo < 0)
            throw new DomainException("Estoque mínimo não pode ser negativo.");
        if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
            throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

        return new Ingrediente
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            CodigoInterno = codigoInterno,
            CategoriaId = categoriaId,
            UnidadeMedidaId = unidadeMedidaId,
            EstoqueAtual = 0,
            EstoqueMinimo = estoqueMinimo,
            EstoqueMaximo = estoqueMaximo,
            Observacoes = observacoes,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void Atualizar(
        string nome,
        short unidadeMedidaId,
        decimal estoqueMinimo,
        Guid atualizadoPor,
        string? codigoInterno = null,
        Guid? categoriaId = null,
        decimal? estoqueMaximo = null,
        string? observacoes = null)
    {
        if (estoqueMinimo < 0)
            throw new DomainException("Estoque mínimo não pode ser negativo.");
        if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
            throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

        Nome = nome;
        CodigoInterno = codigoInterno;
        CategoriaId = categoriaId;
        UnidadeMedidaId = unidadeMedidaId;
        EstoqueMinimo = estoqueMinimo;
        EstoqueMaximo = estoqueMaximo;
        Observacoes = observacoes;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Desativar(Guid atualizadoPor)
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void AtualizarEstoque(decimal novoSaldo, Guid atualizadoPor)
    {
        EstoqueAtual = Math.Max(0, novoSaldo);
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void AtualizarCusto(decimal? custoUnitario, Guid atualizadoPor)
    {
        if (custoUnitario.HasValue && custoUnitario < 0)
            throw new DomainException("Custo unitário não pode ser negativo.");
        CustoUnitario = custoUnitario;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public bool EstaBaixoDoMinimo() => EstoqueAtual < EstoqueMinimo;
}
