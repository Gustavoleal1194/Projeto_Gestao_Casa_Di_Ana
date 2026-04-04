using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class HistoricoImpressaoEtiqueta
{
    public Guid Id { get; private set; }
    public Guid ProdutoId { get; private set; }
    public Produto? Produto { get; private set; }
    public TipoEtiqueta TipoEtiqueta { get; private set; }
    public int Quantidade { get; private set; }
    public DateTime DataProducao { get; private set; }
    public Guid ImpressoPor { get; private set; }
    public DateTime ImpressoEm { get; private set; }

    private HistoricoImpressaoEtiqueta() { }

    public static HistoricoImpressaoEtiqueta Criar(
        Guid produtoId,
        TipoEtiqueta tipoEtiqueta,
        int quantidade,
        DateTime dataProducao,
        Guid impressoPor)
    {
        return new HistoricoImpressaoEtiqueta
        {
            Id = Guid.NewGuid(),
            ProdutoId = produtoId,
            TipoEtiqueta = tipoEtiqueta,
            Quantidade = quantidade,
            DataProducao = dataProducao.Date,
            ImpressoPor = impressoPor,
            ImpressoEm = DateTime.UtcNow,
        };
    }
}
