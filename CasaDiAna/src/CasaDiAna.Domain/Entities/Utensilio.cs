using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Utensilio
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string? CodigoInterno { get; private set; }
    public Guid? CategoriaUtensilioId { get; private set; }
    public short UnidadeMedidaId { get; private set; }
    public decimal EstoqueAtual { get; private set; }
    public decimal EstoqueMinimo { get; private set; }
    public decimal? EstoqueMaximo { get; private set; }
    public decimal? CustoUnitario { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public UnidadeMedida? UnidadeMedida { get; private set; }
    public CategoriaUtensilio? Categoria { get; private set; }

    private Utensilio() { }

    public static Utensilio Criar(
        string nome,
        short unidadeMedidaId,
        decimal estoqueMinimo,
        Guid criadoPor,
        string? codigoInterno = null,
        Guid? categoriaUtensilioId = null,
        decimal? estoqueMaximo = null)
    {
        if (estoqueMinimo < 0)
            throw new DomainException("Estoque mínimo não pode ser negativo.");
        if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
            throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

        return new Utensilio
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            CodigoInterno = codigoInterno,
            CategoriaUtensilioId = categoriaUtensilioId,
            UnidadeMedidaId = unidadeMedidaId,
            EstoqueAtual = 0,
            EstoqueMinimo = estoqueMinimo,
            EstoqueMaximo = estoqueMaximo,
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
        Guid? categoriaUtensilioId = null,
        decimal? estoqueMaximo = null)
    {
        if (estoqueMinimo < 0)
            throw new DomainException("Estoque mínimo não pode ser negativo.");
        if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
            throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

        Nome = nome;
        CodigoInterno = codigoInterno;
        CategoriaUtensilioId = categoriaUtensilioId;
        UnidadeMedidaId = unidadeMedidaId;
        EstoqueMinimo = estoqueMinimo;
        EstoqueMaximo = estoqueMaximo;
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
