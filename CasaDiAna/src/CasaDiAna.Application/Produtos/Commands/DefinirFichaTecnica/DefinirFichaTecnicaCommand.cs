using CasaDiAna.Application.Produtos.Dtos;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.DefinirFichaTecnica;

public record ItemFichaTecnicaInput(Guid IngredienteId, decimal QuantidadePorUnidade);

public record DefinirFichaTecnicaCommand(
    Guid ProdutoId,
    IReadOnlyList<ItemFichaTecnicaInput> Itens) : IRequest<FichaTecnicaDto>;
