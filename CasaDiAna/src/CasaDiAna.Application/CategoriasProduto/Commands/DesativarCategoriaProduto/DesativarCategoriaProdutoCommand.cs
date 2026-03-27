using MediatR;

namespace CasaDiAna.Application.CategoriasProduto.Commands.DesativarCategoriaProduto;

public record DesativarCategoriaProdutoCommand(Guid Id) : IRequest;
