namespace CasaDiAna.Application.ImportacaoVendas.Dtos;

public enum StatusImportacao
{
    Matched    = 1,
    Ambiguous  = 2,
    Unmatched  = 3,
    Ignored    = 4,
}
