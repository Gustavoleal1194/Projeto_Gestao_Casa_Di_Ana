using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Produto
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public Guid? CategoriaProdutoId { get; private set; }
    public string? Descricao { get; private set; }
    public decimal PrecoVenda { get; private set; }
    public TipoProduto Tipo { get; private set; }
    public decimal? CustoUnitario { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public CategoriaProduto? Categoria { get; private set; }
    public IReadOnlyCollection<ItemFichaTecnica> ItensFicha => _itensFicha.AsReadOnly();
    private readonly List<ItemFichaTecnica> _itensFicha = new();

    private Produto() { }

    public static Produto Criar(
        string nome,
        decimal precoVenda,
        Guid criadoPor,
        Guid? categoriaProdutoId = null,
        string? descricao = null,
        TipoProduto tipo = TipoProduto.Produzido)
    {
        if (precoVenda <= 0)
            throw new DomainException("Preço de venda deve ser maior que zero.");

        return new Produto
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            CategoriaProdutoId = categoriaProdutoId,
            Descricao = descricao,
            PrecoVenda = precoVenda,
            Tipo = tipo,
            CustoUnitario = null,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void Atualizar(
        string nome,
        decimal precoVenda,
        Guid atualizadoPor,
        Guid? categoriaProdutoId = null,
        string? descricao = null,
        TipoProduto tipo = TipoProduto.Produzido)
    {
        if (precoVenda <= 0)
            throw new DomainException("Preço de venda deve ser maior que zero.");

        Nome = nome;
        CategoriaProdutoId = categoriaProdutoId;
        Descricao = descricao;
        PrecoVenda = precoVenda;
        Tipo = tipo;
        // Custo unitário só faz sentido para revenda; ao virar produzido, zera.
        if (tipo == TipoProduto.Produzido)
            CustoUnitario = null;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Desativar(Guid atualizadoPor)
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void DefinirCustoUnitario(decimal custoUnitario)
    {
        if (Tipo != TipoProduto.Revenda)
            throw new DomainException("Custo unitário só se aplica a bebida pronta (revenda).");
        if (custoUnitario <= 0)
            throw new DomainException("Custo unitário deve ser maior que zero.");

        CustoUnitario = custoUnitario;
        AtualizadoEm = DateTime.UtcNow;
    }

    public void DefinirFichaTecnica(IEnumerable<(Guid ingredienteId, decimal quantidade)> itens)
    {
        if (Tipo == TipoProduto.Revenda)
            throw new DomainException("Bebida pronta (revenda) não tem ficha de ingredientes.");

        var listaItens = itens.ToList();

        var duplicados = listaItens
            .GroupBy(i => i.ingredienteId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (duplicados.Any())
            throw new DomainException("A ficha técnica não pode ter o mesmo ingrediente mais de uma vez.");

        _itensFicha.Clear();
        foreach (var (ingredienteId, quantidade) in listaItens)
            _itensFicha.Add(ItemFichaTecnica.Criar(Id, ingredienteId, quantidade));

        AtualizadoEm = DateTime.UtcNow;
    }

    public decimal CalcularCustoFicha()
    {
        if (Tipo == TipoProduto.Revenda)
            return CustoUnitario ?? 0;

        return _itensFicha.Sum(i =>
            i.QuantidadePorUnidade * (i.Ingrediente?.CustoUnitario ?? 0));
    }

    public decimal? CalcularMargemLucro()
    {
        if (PrecoVenda <= 0) return null;
        var custo = CalcularCustoFicha();
        return ((PrecoVenda - custo) / PrecoVenda) * 100;
    }
}
