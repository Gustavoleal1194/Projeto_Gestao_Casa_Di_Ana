using CasaDiAna.Application.CategoriasProduto.Commands.CriarCategoriaProduto;
using CasaDiAna.Application.CategoriasProduto.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasProduto.Commands.AtualizarCategoriaProduto;

public class AtualizarCategoriaProdutoCommandHandler
    : IRequestHandler<AtualizarCategoriaProdutoCommand, CategoriaProdutoDto>
{
    private readonly ICategoriaProdutoRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public AtualizarCategoriaProdutoCommandHandler(
        ICategoriaProdutoRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<CategoriaProdutoDto> Handle(
        AtualizarCategoriaProdutoCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        if (await _categorias.NomeExisteAsync(request.Nome, request.Id, cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome}'.");

        categoria.Atualizar(request.Nome, _currentUser.UsuarioId);
        _categorias.Atualizar(categoria);
        await _categorias.SalvarAsync(cancellationToken);

        return CriarCategoriaProdutoCommandHandler.ToDto(categoria);
    }
}
