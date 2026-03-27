using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Queries.ListarProdutos;

public class ListarProdutosQueryHandler
    : IRequestHandler<ListarProdutosQuery, IReadOnlyList<ProdutoResumoDto>>
{
    private readonly IProdutoRepository _produtos;

    public ListarProdutosQueryHandler(IProdutoRepository produtos) => _produtos = produtos;

    public async Task<IReadOnlyList<ProdutoResumoDto>> Handle(
        ListarProdutosQuery request, CancellationToken cancellationToken)
    {
        var lista = await _produtos.ListarAsync(request.ApenasAtivos, cancellationToken);
        return lista
            .Select(p => new ProdutoResumoDto(p.Id, p.Nome, p.Categoria?.Nome, p.PrecoVenda, p.Ativo))
            .ToList()
            .AsReadOnly();
    }
}
