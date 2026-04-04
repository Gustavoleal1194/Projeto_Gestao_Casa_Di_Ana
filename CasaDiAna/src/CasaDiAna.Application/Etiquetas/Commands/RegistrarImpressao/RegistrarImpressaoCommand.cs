using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;

public record RegistrarImpressaoCommand(
    Guid ProdutoId,
    TipoEtiqueta TipoEtiqueta,
    int Quantidade,
    DateTime DataProducao) : IRequest<HistoricoImpressaoDto>;
