using CasaDiAna.Application.Produtos.Dtos;
using MediatR;

namespace CasaDiAna.Application.Produtos.Queries.ObterProduto;

public record ObterProdutoQuery(Guid Id) : IRequest<ProdutoDto>;
