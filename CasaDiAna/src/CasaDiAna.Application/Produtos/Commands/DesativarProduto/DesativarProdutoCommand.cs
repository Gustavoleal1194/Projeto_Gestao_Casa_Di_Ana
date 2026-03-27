using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.DesativarProduto;

public record DesativarProdutoCommand(Guid Id) : IRequest;
