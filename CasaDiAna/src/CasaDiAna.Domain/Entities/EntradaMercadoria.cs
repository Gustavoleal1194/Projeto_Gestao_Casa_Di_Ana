using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class EntradaMercadoria
{
    public Guid Id { get; private set; }
    public Guid FornecedorId { get; private set; }
    public string? NumeroNotaFiscal { get; private set; }
    public DateTime DataEntrada { get; private set; }
    public string? RecebidoPor { get; private set; }
    public string? Observacoes { get; private set; }
    public StatusEntrada Status { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    public Fornecedor? Fornecedor { get; private set; }
    public IReadOnlyCollection<ItemEntradaMercadoria> Itens => _itens.AsReadOnly();
    private readonly List<ItemEntradaMercadoria> _itens = new();
    public IReadOnlyCollection<ItemEntradaUtensilio> ItensUtensilio => _itensUtensilio.AsReadOnly();
    private readonly List<ItemEntradaUtensilio> _itensUtensilio = new();
    public IReadOnlyCollection<BoletoEntrada> Boletos => _boletos.AsReadOnly();
    private readonly List<BoletoEntrada> _boletos = new();

    public decimal CustoTotal => _itens.Sum(i => i.CustoTotal) + _itensUtensilio.Sum(i => i.CustoTotal);
    public int TotalItens => _itens.Count + _itensUtensilio.Count;
    public bool TemBoleto => _boletos.Count > 0;
    public DateTime? ProximoVencimentoBoleto => _boletos.Count > 0 ? _boletos.Min(b => b.DataVencimento) : null;

    private const string MensagemEdicaoCancelada = "Não é possível editar uma entrada cancelada.";
    private const string MensagemItemInexistente = "Item não pertence a esta entrada.";

    private EntradaMercadoria() { }

    public static EntradaMercadoria Criar(
        Guid fornecedorId,
        DateTime dataEntrada,
        Guid criadoPor,
        string? numeroNotaFiscal = null,
        string? recebidoPor = null,
        string? observacoes = null)
    {
        return new EntradaMercadoria
        {
            Id = Guid.NewGuid(),
            FornecedorId = fornecedorId,
            NumeroNotaFiscal = numeroNotaFiscal,
            DataEntrada = dataEntrada,
            RecebidoPor = recebidoPor,
            Observacoes = observacoes,
            Status = StatusEntrada.Confirmada,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void AdicionarItem(Guid ingredienteId, decimal quantidade, decimal custoUnitario)
    {
        GarantirConfirmada("Não é possível adicionar itens a uma entrada cancelada.");
        ValidarQuantidadeECusto(quantidade, custoUnitario);
        if (_itens.Any(i => i.IngredienteId == ingredienteId))
            throw new DomainException("Ingrediente já adicionado nesta entrada.");

        _itens.Add(ItemEntradaMercadoria.Criar(Id, ingredienteId, quantidade, custoUnitario));
    }

    public void AdicionarItemUtensilio(Guid utensilioId, decimal quantidade, decimal custoUnitario)
    {
        GarantirConfirmada("Não é possível adicionar itens a uma entrada cancelada.");
        ValidarQuantidadeECusto(quantidade, custoUnitario);
        if (_itensUtensilio.Any(i => i.UtensilioId == utensilioId))
            throw new DomainException("Utensílio já adicionado nesta entrada.");

        _itensUtensilio.Add(ItemEntradaUtensilio.Criar(Id, utensilioId, quantidade, custoUnitario));
    }

    public void AdicionarBoleto(DateTime dataVencimento)
    {
        GarantirConfirmada("Não é possível adicionar boleto a uma entrada cancelada.");

        _boletos.Add(BoletoEntrada.Criar(Id, dataVencimento));
    }

    public void AtualizarCabecalho(
        Guid fornecedorId,
        DateTime dataEntrada,
        string? numeroNotaFiscal,
        string? recebidoPor,
        string? observacoes,
        Guid atualizadoPor)
    {
        GarantirConfirmada(MensagemEdicaoCancelada);

        FornecedorId = fornecedorId;
        DataEntrada = dataEntrada;
        NumeroNotaFiscal = numeroNotaFiscal;
        RecebidoPor = recebidoPor;
        Observacoes = observacoes;
        RegistrarAlteracao(atualizadoPor);
    }

    /// <summary>
    /// Substitui os boletos pela lista informada. Boletos cuja data já existia são mantidos
    /// (mesmo vencidos); datas novas precisam ser hoje ou no futuro.
    /// </summary>
    public AlteracaoBoletos SubstituirBoletos(IEnumerable<DateTime> datasVencimento, DateTime hoje, Guid atualizadoPor)
    {
        GarantirConfirmada(MensagemEdicaoCancelada);

        var semCorrespondencia = _boletos.ToList();
        var datasNovas = new List<DateTime>();
        foreach (var data in datasVencimento)
        {
            var existente = semCorrespondencia.FirstOrDefault(b => b.DataVencimento.Date == data.Date);
            if (existente is null)
                datasNovas.Add(data);
            else
                semCorrespondencia.Remove(existente);
        }

        if (datasNovas.Any(d => d.Date < hoje.Date))
            throw new DomainException("A data de vencimento do boleto deve ser hoje ou no futuro.");

        foreach (var removido in semCorrespondencia)
            _boletos.Remove(removido);

        var adicionados = datasNovas.Select(d => BoletoEntrada.Criar(Id, d)).ToList();
        _boletos.AddRange(adicionados);
        RegistrarAlteracao(atualizadoPor);

        return new AlteracaoBoletos(semCorrespondencia, adicionados);
    }

    public void AlterarCustoItem(Guid itemId, decimal custoUnitario, Guid atualizadoPor)
    {
        GarantirConfirmada(MensagemEdicaoCancelada);
        ValidarCusto(custoUnitario);
        var item = _itens.FirstOrDefault(i => i.Id == itemId)
            ?? throw new DomainException(MensagemItemInexistente);

        item.AlterarCustoUnitario(custoUnitario);
        RegistrarAlteracao(atualizadoPor);
    }

    public void AlterarCustoItemUtensilio(Guid itemId, decimal custoUnitario, Guid atualizadoPor)
    {
        GarantirConfirmada(MensagemEdicaoCancelada);
        ValidarCusto(custoUnitario);
        var item = _itensUtensilio.FirstOrDefault(i => i.Id == itemId)
            ?? throw new DomainException(MensagemItemInexistente);

        item.AlterarCustoUnitario(custoUnitario);
        RegistrarAlteracao(atualizadoPor);
    }

    public void Cancelar(Guid atualizadoPor)
    {
        if (Status == StatusEntrada.Cancelada)
            throw new DomainException("Entrada já está cancelada.");

        Status = StatusEntrada.Cancelada;
        RegistrarAlteracao(atualizadoPor);
    }

    private void GarantirConfirmada(string mensagem)
    {
        if (Status != StatusEntrada.Confirmada)
            throw new DomainException(mensagem);
    }

    private static void ValidarQuantidadeECusto(decimal quantidade, decimal custoUnitario)
    {
        if (quantidade <= 0)
            throw new DomainException("Quantidade deve ser maior que zero.");
        ValidarCusto(custoUnitario);
    }

    private static void ValidarCusto(decimal custoUnitario)
    {
        if (custoUnitario < 0)
            throw new DomainException("Custo unitário não pode ser negativo.");
    }

    private void RegistrarAlteracao(Guid atualizadoPor)
    {
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
