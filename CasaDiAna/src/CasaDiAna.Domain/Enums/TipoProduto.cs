namespace CasaDiAna.Domain.Enums;

public enum TipoProduto
{
    /// <summary>Produzido em lote: insumos baixados no lançamento da produção.</summary>
    Produzido   = 1,
    /// <summary>Comprado pronto: sem ficha de ingredientes.</summary>
    Revenda     = 2,
    /// <summary>Preparado na hora do pedido: insumos baixados na venda, sem produção.</summary>
    FeitoNaHora = 3,
}
