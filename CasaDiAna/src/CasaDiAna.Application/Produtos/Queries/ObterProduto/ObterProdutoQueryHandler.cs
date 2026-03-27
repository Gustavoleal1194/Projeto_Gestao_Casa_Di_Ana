using CasaDiAna.Application.Produtos.Commands.CriarProduto;
using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Queries.ObterProduto;

public class ObterProdutoQueryHandler : IRequestHandler<ObterProdutoQuery, ProdutoDto>
{
    private readonly IProdutoRepository _produtos;

    public ObterProdutoQueryHandler(IProdutoRepository produtos) => _produtos = produtos;

    public async Task<ProdutoDto> Handle(ObterProdutoQuery request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        return CriarProdutoCommandHandler.ToDto(produto);
    }
}
