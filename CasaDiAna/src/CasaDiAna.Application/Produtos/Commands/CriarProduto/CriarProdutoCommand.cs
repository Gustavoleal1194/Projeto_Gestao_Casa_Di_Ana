using CasaDiAna.Application.Produtos.Dtos;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.CriarProduto;

public record CriarProdutoCommand(
    string Nome,
    decimal PrecoVenda,
    Guid? CategoriaProdutoId = null,
    string? Descricao = null) : IRequest<ProdutoDto>;
