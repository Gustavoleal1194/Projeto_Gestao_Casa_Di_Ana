using CasaDiAna.Application.Ingredientes.Dtos;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Commands.CriarIngrediente;

public record CriarIngredienteCommand(
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaId = null,
    decimal? EstoqueMaximo = null,
    string? Observacoes = null,
    string? QuantidadeEmbalagem = null) : IRequest<IngredienteDto>;
