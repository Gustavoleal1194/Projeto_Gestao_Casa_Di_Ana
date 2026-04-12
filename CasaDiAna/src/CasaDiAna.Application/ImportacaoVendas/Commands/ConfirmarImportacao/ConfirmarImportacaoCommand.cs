using CasaDiAna.Application.ImportacaoVendas.Dtos;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

public record ConfirmarImportacaoCommand(
    string Hash,
    string NomeArquivo,
    DateTime DataVenda,
    string? PeriodoDe,
    string? PeriodoAte,
    int TotalLinhasParseadas,
    int TotalIgnoradas,
    int TotalNaoEncontradas,
    IReadOnlyList<ItemConfirmarDto> Itens
) : IRequest<ResultadoImportacaoDto>;
