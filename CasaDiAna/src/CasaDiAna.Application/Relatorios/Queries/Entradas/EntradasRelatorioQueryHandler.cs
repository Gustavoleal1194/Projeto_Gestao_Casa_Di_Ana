using CasaDiAna.Application.Relatorios.Dtos;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.Entradas;

public class EntradasRelatorioQueryHandler : IRequestHandler<EntradasRelatorioQuery, EntradaRelatorioResumoDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;

    public EntradasRelatorioQueryHandler(IEntradaMercadoriaRepository entradas)
    {
        _entradas = entradas;
    }

    public async Task<EntradaRelatorioResumoDto> Handle(
        EntradasRelatorioQuery request, CancellationToken cancellationToken)
    {
        var lista = await _entradas.ListarAsync(request.De, request.Ate, cancellationToken);

        var entradas = lista.Select(e => new EntradaRelatorioDto(
            e.Id,
            e.Fornecedor?.RazaoSocial ?? string.Empty,
            e.NumeroNotaFiscal,
            e.DataEntrada,
            e.Status.ToString(),
            e.Itens.Count,
            e.Itens.Sum(i => i.CustoTotal))).ToList().AsReadOnly();

        var confirmadas = entradas.Where(e => e.Status == StatusEntrada.Confirmada.ToString()).ToList();

        return new EntradaRelatorioResumoDto(
            request.De,
            request.Ate,
            entradas.Count,
            confirmadas.Count,
            confirmadas.Sum(e => e.CustoTotal),
            entradas);
    }
}
