using CasaDiAna.Application.ImportacaoVendas.Dtos;

namespace CasaDiAna.API.Controllers;

/// <summary>Corpo multipart do POST /api/importacao-vendas/confirmar.</summary>
public class ConfirmarImportacaoForm
{
    public IFormFile? Arquivo { get; set; }
    public DateTime DataVenda { get; set; }
    public List<VinculoLinhaDto> Vinculos { get; set; } = [];
    public List<string> LinhasRemovidas { get; set; } = [];
}
