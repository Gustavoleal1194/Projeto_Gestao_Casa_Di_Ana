using CasaDiAna.Application.Produtos.Commands.DefinirFichaTecnica;
using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.DefinirCustoUnitario;

public class DefinirCustoUnitarioCommandHandler
    : IRequestHandler<DefinirCustoUnitarioCommand, FichaTecnicaDto>
{
    private readonly IProdutoRepository _produtos;

    public DefinirCustoUnitarioCommandHandler(IProdutoRepository produtos)
        => _produtos = produtos;

    public async Task<FichaTecnicaDto> Handle(
        DefinirCustoUnitarioCommand request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdComFichaAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        produto.DefinirCustoUnitario(request.CustoUnitario);

        _produtos.Atualizar(produto);
        await _produtos.SalvarAsync(cancellationToken);

        var atualizado = await _produtos.ObterPorIdComFichaAsync(produto.Id, cancellationToken);
        return DefinirFichaTecnicaCommandHandler.ToFichaTecnicaDto(atualizado!);
    }
}
