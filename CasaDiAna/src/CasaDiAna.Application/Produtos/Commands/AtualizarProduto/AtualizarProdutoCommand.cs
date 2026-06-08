using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.AtualizarProduto;

public record AtualizarProdutoCommand(
    Guid Id,
    string Nome,
    decimal PrecoVenda,
    Guid? CategoriaProdutoId = null,
    string? Descricao = null,
    TipoProduto Tipo = TipoProduto.Produzido) : IRequest<ProdutoDto>;
