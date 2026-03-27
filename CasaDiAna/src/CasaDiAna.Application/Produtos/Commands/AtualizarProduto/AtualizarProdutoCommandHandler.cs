using CasaDiAna.Application.Common;
using CasaDiAna.Application.Produtos.Commands.CriarProduto;
using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.AtualizarProduto;

public class AtualizarProdutoCommandHandler : IRequestHandler<AtualizarProdutoCommand, ProdutoDto>
{
    private readonly IProdutoRepository _produtos;
    private readonly ICategoriaProdutoRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public AtualizarProdutoCommandHandler(
        IProdutoRepository produtos,
        ICategoriaProdutoRepository categorias,
        ICurrentUserService currentUser)
    {
        _produtos = produtos;
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<ProdutoDto> Handle(AtualizarProdutoCommand request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        if (await _produtos.NomeExisteAsync(request.Nome, request.Id, cancellationToken))
            throw new DomainException($"Já existe um produto com o nome '{request.Nome}'.");

        if (request.CategoriaProdutoId.HasValue &&
            await _categorias.ObterPorIdAsync(request.CategoriaProdutoId.Value, cancellationToken) is null)
            throw new DomainException("Categoria de produto não encontrada.");

        produto.Atualizar(
            request.Nome,
            request.PrecoVenda,
            _currentUser.UsuarioId,
            request.CategoriaProdutoId,
            request.Descricao);

        _produtos.Atualizar(produto);
        await _produtos.SalvarAsync(cancellationToken);

        var atualizado = await _produtos.ObterPorIdAsync(produto.Id, cancellationToken);
        return CriarProdutoCommandHandler.ToDto(atualizado!);
    }
}
