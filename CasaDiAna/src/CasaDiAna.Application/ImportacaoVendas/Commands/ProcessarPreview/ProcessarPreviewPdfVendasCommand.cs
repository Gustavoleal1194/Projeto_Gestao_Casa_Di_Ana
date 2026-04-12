using CasaDiAna.Application.ImportacaoVendas.Dtos;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;

public record ProcessarPreviewPdfVendasCommand(
    byte[] PdfBytes,
    string NomeArquivo
) : IRequest<PreviewImportacaoDto>;
