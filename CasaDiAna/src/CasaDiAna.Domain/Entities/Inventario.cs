using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class Inventario
{
    public Guid Id { get; private set; }
    public DateTime DataRealizacao { get; private set; }
    public string? Descricao { get; private set; }
    public StatusInventario Status { get; private set; }
    public DateTime? FinalizadoEm { get; private set; }
    public string? Observacoes { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public IReadOnlyCollection<ItemInventario> Itens => _itens.AsReadOnly();
    private readonly List<ItemInventario> _itens = new();

    private Inventario() { }

    public static Inventario Criar(
        DateTime dataRealizacao,
        Guid criadoPor,
        string? descricao = null,
        string? observacoes = null)
    {
        return new Inventario
        {
            Id = Guid.NewGuid(),
            DataRealizacao = dataRealizacao,
            Descricao = descricao,
            Status = StatusInventario.EmAndamento,
            Observacoes = observacoes,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void AdicionarItem(
        Guid ingredienteId,
        decimal quantidadeSistema,
        decimal quantidadeContada,
        string? observacoes = null)
    {
        if (Status != StatusInventario.EmAndamento)
            throw new DomainException("Não é possível modificar um inventário já finalizado ou cancelado.");
        if (_itens.Any(i => i.IngredienteId == ingredienteId))
            throw new DomainException("Ingrediente já incluído neste inventário.");

        _itens.Add(ItemInventario.Criar(Id, ingredienteId, quantidadeSistema, quantidadeContada, observacoes));
    }

    public void Finalizar(Guid atualizadoPor)
    {
        if (Status != StatusInventario.EmAndamento)
            throw new DomainException("Apenas inventários em andamento podem ser finalizados.");
        if (!_itens.Any())
            throw new DomainException("Não é possível finalizar um inventário sem itens.");

        Status = StatusInventario.Finalizado;
        FinalizadoEm = DateTime.UtcNow;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Cancelar(Guid atualizadoPor)
    {
        if (Status == StatusInventario.Finalizado)
            throw new DomainException("Inventários finalizados não podem ser cancelados.");

        Status = StatusInventario.Cancelado;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
