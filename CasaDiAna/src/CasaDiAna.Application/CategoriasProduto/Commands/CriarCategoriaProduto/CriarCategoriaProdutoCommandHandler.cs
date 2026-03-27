using CasaDiAna.Application.CategoriasProduto.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasProduto.Commands.CriarCategoriaProduto;

public class CriarCategoriaProdutoCommandHandler
    : IRequestHandler<CriarCategoriaProdutoCommand, CategoriaProdutoDto>
{
    private readonly ICategoriaProdutoRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public CriarCategoriaProdutoCommandHandler(
        ICategoriaProdutoRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<CategoriaProdutoDto> Handle(
        CriarCategoriaProdutoCommand request, CancellationToken cancellationToken)
    {
        if (await _categorias.NomeExisteAsync(request.Nome, ct: cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome}'.");

        var categoria = CategoriaProduto.Criar(request.Nome, _currentUser.UsuarioId);

        await _categorias.AdicionarAsync(categoria, cancellationToken);
        await _categorias.SalvarAsync(cancellationToken);

        return ToDto(categoria);
    }

    internal static CategoriaProdutoDto ToDto(CategoriaProduto c) =>
        new(c.Id, c.Nome, c.Ativo, c.AtualizadoEm);
}
