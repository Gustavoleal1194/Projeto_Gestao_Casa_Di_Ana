using CasaDiAna.Application.Produtos.Commands.DefinirFichaTecnica;
using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Queries.ObterFichaTecnica;

public class ObterFichaTecnicaQueryHandler : IRequestHandler<ObterFichaTecnicaQuery, FichaTecnicaDto>
{
    private readonly IProdutoRepository _produtos;

    public ObterFichaTecnicaQueryHandler(IProdutoRepository produtos) => _produtos = produtos;

    public async Task<FichaTecnicaDto> Handle(
        ObterFichaTecnicaQuery request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdComFichaAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        return DefinirFichaTecnicaCommandHandler.ToFichaTecnicaDto(produto);
    }
}
