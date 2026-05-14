using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Queries.ListarEntradas;

public class ListarEntradasQueryHandler : IRequestHandler<ListarEntradasQuery, IReadOnlyList<EntradaMercadoriaResumoDto>>
{
    private readonly IEntradaMercadoriaRepository _entradas;

    public ListarEntradasQueryHandler(IEntradaMercadoriaRepository entradas)
    {
        _entradas = entradas;
    }

    public async Task<IReadOnlyList<EntradaMercadoriaResumoDto>> Handle(
        ListarEntradasQuery request, CancellationToken cancellationToken)
    {
        var lista = await _entradas.ListarAsync(request.De, request.Ate, cancellationToken);

        return lista.Select(e => new EntradaMercadoriaResumoDto(
            e.Id,
            e.Fornecedor?.RazaoSocial ?? string.Empty,
            e.NumeroNotaFiscal,
            e.DataEntrada,
            e.Status.ToString(),
            e.RecebidoPor,
            e.Itens.Count,
            e.Itens.Sum(i => i.CustoTotal),
            e.CriadoEm,
            e.TemBoleto,
            e.DataVencimentoBoleto)).ToList().AsReadOnly();
    }
}
