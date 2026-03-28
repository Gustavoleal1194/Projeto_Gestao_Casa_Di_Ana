using CasaDiAna.Application.Perdas.Commands.RegistrarPerda;
using CasaDiAna.Application.Perdas.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Perdas.Queries.ListarPerdas;

public class ListarPerdasQueryHandler : IRequestHandler<ListarPerdasQuery, IReadOnlyList<PerdaProdutoDto>>
{
    private readonly IPerdaProdutoRepository _perdas;

    public ListarPerdasQueryHandler(IPerdaProdutoRepository perdas) => _perdas = perdas;

    public async Task<IReadOnlyList<PerdaProdutoDto>> Handle(
        ListarPerdasQuery request, CancellationToken cancellationToken)
    {
        var lista = await _perdas.ListarAsync(request.De, request.Ate, request.ProdutoId, cancellationToken);

        return lista
            .Select(p => RegistrarPerdaCommandHandler.ToDto(p, p.Produto?.Nome ?? string.Empty))
            .ToList()
            .AsReadOnly();
    }
}
