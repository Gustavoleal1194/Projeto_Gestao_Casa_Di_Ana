using CasaDiAna.Application.Produtos.Dtos;
using MediatR;

namespace CasaDiAna.Application.Produtos.Queries.ListarProdutos;

public record ListarProdutosQuery(bool ApenasAtivos = true) : IRequest<IReadOnlyList<ProdutoResumoDto>>;
