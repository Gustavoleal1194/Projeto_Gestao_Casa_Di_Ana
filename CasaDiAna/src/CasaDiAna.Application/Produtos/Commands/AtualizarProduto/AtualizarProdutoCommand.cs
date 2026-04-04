using CasaDiAna.Application.Produtos.Dtos;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.AtualizarProduto;

public record AtualizarProdutoCommand(
    Guid Id,
    string Nome,
    decimal PrecoVenda,
    Guid? CategoriaProdutoId = null,
    string? Descricao = null,
    int? DiasValidade = null) : IRequest<ProdutoDto>;
