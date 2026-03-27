using CasaDiAna.Application.CategoriasProduto.Commands.CriarCategoriaProduto;
using CasaDiAna.Application.CategoriasProduto.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasProduto.Queries.ListarCategoriasProduto;

public class ListarCategoriasProdutoQueryHandler
    : IRequestHandler<ListarCategoriasProdutoQuery, IReadOnlyList<CategoriaProdutoDto>>
{
    private readonly ICategoriaProdutoRepository _categorias;

    public ListarCategoriasProdutoQueryHandler(ICategoriaProdutoRepository categorias) =>
        _categorias = categorias;

    public async Task<IReadOnlyList<CategoriaProdutoDto>> Handle(
        ListarCategoriasProdutoQuery request, CancellationToken cancellationToken)
    {
        var lista = await _categorias.ListarAsync(request.ApenasAtivos, cancellationToken);
        return lista.Select(CriarCategoriaProdutoCommandHandler.ToDto).ToList().AsReadOnly();
    }
}
