using CasaDiAna.Application.Ingredientes.Dtos;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Commands.AtualizarIngrediente;

public record AtualizarIngredienteCommand(
    Guid Id,
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaId = null,
    decimal? EstoqueMaximo = null,
    string? Observacoes = null,
    decimal? QuantidadeEmbalagemValor = null,
    string? UnidadeEmbalagem = null) : IRequest<IngredienteDto>;
