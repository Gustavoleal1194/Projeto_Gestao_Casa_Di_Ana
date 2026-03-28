using MediatR;

namespace CasaDiAna.Application.Estoque.Commands.CorrigirEstoque;

public record CorrigirEstoqueItemInput(Guid IngredienteId, decimal NovaQuantidade, string? Observacao);

public record CorrigirEstoqueCommand(IReadOnlyList<CorrigirEstoqueItemInput> Itens) : IRequest;
