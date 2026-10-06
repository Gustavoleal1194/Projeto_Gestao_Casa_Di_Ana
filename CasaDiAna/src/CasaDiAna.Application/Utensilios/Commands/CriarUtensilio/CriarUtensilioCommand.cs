using CasaDiAna.Application.Utensilios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;

public record CriarUtensilioCommand(
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaUtensilioId = null,
    decimal? EstoqueMaximo = null) : IRequest<UtensilioDto>;
