using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Queries.ObterComprasMes;

public class ObterComprasMesQueryHandler : IRequestHandler<ObterComprasMesQuery, ComprasMesDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;

    public ObterComprasMesQueryHandler(IEntradaMercadoriaRepository entradas) => _entradas = entradas;

    public async Task<ComprasMesDto> Handle(ObterComprasMesQuery request, CancellationToken cancellationToken)
    {
        var competencia = Despesa.NormalizarCompetencia(request.Competencia);
        var fim = competencia.AddMonths(1).AddDays(-1);

        var entradas = await _entradas.ListarAsync(competencia, fim, cancellationToken);

        var itens = entradas
            .Where(e => e.Status == StatusEntrada.Confirmada)
            .Select(e => new CompraNotaDto(
                e.Id,
                e.Fornecedor?.RazaoSocial ?? string.Empty,
                e.NumeroNotaFiscal,
                e.DataEntrada,
                e.Itens.Sum(i => i.CustoTotal)))
            .OrderByDescending(c => c.Data)
            .ToList();

        return new ComprasMesDto(competencia, itens.Sum(c => c.Total), itens);
    }
}
