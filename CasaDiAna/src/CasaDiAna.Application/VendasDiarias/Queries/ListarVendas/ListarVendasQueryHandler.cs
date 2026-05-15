using CasaDiAna.Application.VendasDiarias.Commands.RegistrarVenda;
using CasaDiAna.Application.VendasDiarias.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.VendasDiarias.Queries.ListarVendas;

public class ListarVendasQueryHandler
    : IRequestHandler<ListarVendasQuery, IReadOnlyList<VendaDiariaDto>>
{
    private readonly IVendaDiariaRepository _vendas;

    public ListarVendasQueryHandler(IVendaDiariaRepository vendas) => _vendas = vendas;

    public async Task<IReadOnlyList<VendaDiariaDto>> Handle(
        ListarVendasQuery request, CancellationToken cancellationToken)
    {
        var lista = await _vendas.ListarAsync(
            request.De, request.Ate, request.ProdutoIds, cancellationToken);

        return lista
            .Select(v => RegistrarVendaCommandHandler.ToDto(v, v.Produto?.Nome ?? string.Empty))
            .ToList()
            .AsReadOnly();
    }
}
