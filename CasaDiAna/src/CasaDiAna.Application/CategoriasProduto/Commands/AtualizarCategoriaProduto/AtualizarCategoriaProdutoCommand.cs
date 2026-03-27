using CasaDiAna.Application.CategoriasProduto.Dtos;
using MediatR;

namespace CasaDiAna.Application.CategoriasProduto.Commands.AtualizarCategoriaProduto;

public record AtualizarCategoriaProdutoCommand(Guid Id, string Nome) : IRequest<CategoriaProdutoDto>;
