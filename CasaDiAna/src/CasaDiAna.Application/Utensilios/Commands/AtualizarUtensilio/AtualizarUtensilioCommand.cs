using CasaDiAna.Application.Utensilios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.AtualizarUtensilio;

public record AtualizarUtensilioCommand(
    Guid Id,
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaUtensilioId = null,
    decimal? EstoqueMaximo = null) : IRequest<UtensilioDto>;
