using CasaDiAna.Application.CategoriasProduto.Dtos;
using MediatR;

namespace CasaDiAna.Application.CategoriasProduto.Commands.CriarCategoriaProduto;

public record CriarCategoriaProdutoCommand(string Nome) : IRequest<CategoriaProdutoDto>;
