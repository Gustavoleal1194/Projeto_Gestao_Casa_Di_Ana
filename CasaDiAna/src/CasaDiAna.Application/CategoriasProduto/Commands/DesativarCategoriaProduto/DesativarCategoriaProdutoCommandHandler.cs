using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasProduto.Commands.DesativarCategoriaProduto;

public class DesativarCategoriaProdutoCommandHandler
    : IRequestHandler<DesativarCategoriaProdutoCommand>
{
    private readonly ICategoriaProdutoRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public DesativarCategoriaProdutoCommandHandler(
        ICategoriaProdutoRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task Handle(
        DesativarCategoriaProdutoCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        categoria.Desativar(_currentUser.UsuarioId);
        _categorias.Atualizar(categoria);
        await _categorias.SalvarAsync(cancellationToken);
    }
}
