using CasaDiAna.Application.CategoriasProduto.Dtos;
using MediatR;

namespace CasaDiAna.Application.CategoriasProduto.Queries.ListarCategoriasProduto;

public record ListarCategoriasProdutoQuery(bool ApenasAtivos = true)
    : IRequest<IReadOnlyList<CategoriaProdutoDto>>;
