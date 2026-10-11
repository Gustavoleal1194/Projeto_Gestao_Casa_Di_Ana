using CasaDiAna.Application.ImportacaoVendas.Dtos;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

/// <summary>
/// A tela envia o CSV e as decisões do usuário; quantidades, valores, repasses,
/// hash, período e contagens são recalculados do próprio arquivo.
/// </summary>
public record ConfirmarImportacaoCommand(
    byte[] CsvBytes,
    string NomeArquivo,
    DateTime DataVenda,
    IReadOnlyList<VinculoLinhaDto> Vinculos,
    IReadOnlyList<string> LinhasRemovidas
) : IRequest<ResultadoImportacaoDto>;
