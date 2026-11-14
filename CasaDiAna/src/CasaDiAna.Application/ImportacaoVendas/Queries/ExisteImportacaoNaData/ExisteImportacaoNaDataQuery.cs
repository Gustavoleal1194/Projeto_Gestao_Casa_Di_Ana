using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Queries.ExisteImportacaoNaData;

/// <summary>
/// Indica se a data de venda já tem importação — a tela pede confirmação antes de
/// somar novas vendas (e nova baixa de insumos) às já lançadas.
/// </summary>
public record ExisteImportacaoNaDataQuery(DateTime DataVenda) : IRequest<bool>;

public class ExisteImportacaoNaDataQueryHandler : IRequestHandler<ExisteImportacaoNaDataQuery, bool>
{
    private readonly IImportacaoVendasRepository _importacoes;

    public ExisteImportacaoNaDataQueryHandler(IImportacaoVendasRepository importacoes) =>
        _importacoes = importacoes;

    public async Task<bool> Handle(ExisteImportacaoNaDataQuery request, CancellationToken cancellationToken)
    {
        var inicio = request.DataVenda.Date;
        var existentes = await _importacoes.ListarPorDataVendaAsync(inicio, inicio.AddDays(1), cancellationToken);
        return existentes.Count > 0;
    }
}
