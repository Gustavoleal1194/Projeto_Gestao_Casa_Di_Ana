using CasaDiAna.Application.Common;
using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.CriarProduto;

public class CriarProdutoCommandHandler : IRequestHandler<CriarProdutoCommand, ProdutoDto>
{
    private readonly IProdutoRepository _produtos;
    private readonly ICategoriaProdutoRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public CriarProdutoCommandHandler(
        IProdutoRepository produtos,
        ICategoriaProdutoRepository categorias,
        ICurrentUserService currentUser)
    {
        _produtos = produtos;
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<ProdutoDto> Handle(CriarProdutoCommand request, CancellationToken cancellationToken)
    {
        if (await _produtos.NomeExisteAsync(request.Nome, ct: cancellationToken))
            throw new DomainException($"Já existe um produto com o nome '{request.Nome}'.");

        if (request.CategoriaProdutoId.HasValue &&
            await _categorias.ObterPorIdAsync(request.CategoriaProdutoId.Value, cancellationToken) is null)
            throw new DomainException("Categoria de produto não encontrada.");

        var produto = Produto.Criar(
            request.Nome,
            request.PrecoVenda,
            _currentUser.UsuarioId,
            request.CategoriaProdutoId,
            request.Descricao);

        await _produtos.AdicionarAsync(produto, cancellationToken);
        await _produtos.SalvarAsync(cancellationToken);

        var salvo = await _produtos.ObterPorIdAsync(produto.Id, cancellationToken);
        return ToDto(salvo!);
    }

    internal static ProdutoDto ToDto(Produto p) => new(
        p.Id,
        p.Nome,
        p.CategoriaProdutoId,
        p.Categoria?.Nome,
        p.Descricao,
        p.PrecoVenda,
        p.Ativo,
        p.AtualizadoEm);
}
