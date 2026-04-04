using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.Etiquetas.Dtos;

public record HistoricoImpressaoDto(
    Guid Id,
    Guid ProdutoId,
    string ProdutoNome,
    TipoEtiqueta TipoEtiqueta,
    int Quantidade,
    DateTime DataProducao,
    DateTime ImpressoEm);
