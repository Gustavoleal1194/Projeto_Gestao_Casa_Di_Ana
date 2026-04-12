using CasaDiAna.Application.ImportacaoVendas.Dtos;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;

public record ProcessarPreviewVendasCommand(
    byte[] CsvBytes,
    string NomeArquivo
) : IRequest<PreviewImportacaoDto>;
