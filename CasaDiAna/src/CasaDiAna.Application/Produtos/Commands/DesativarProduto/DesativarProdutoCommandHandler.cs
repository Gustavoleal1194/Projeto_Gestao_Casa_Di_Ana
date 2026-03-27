using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.DesativarProduto;

public class DesativarProdutoCommandHandler : IRequestHandler<DesativarProdutoCommand>
{
    private readonly IProdutoRepository _produtos;
    private readonly ICurrentUserService _currentUser;

    public DesativarProdutoCommandHandler(
        IProdutoRepository produtos,
        ICurrentUserService currentUser)
    {
        _produtos = produtos;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarProdutoCommand request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        produto.Desativar(_currentUser.UsuarioId);
        _produtos.Atualizar(produto);
        await _produtos.SalvarAsync(cancellationToken);
    }
}
