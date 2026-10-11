using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Application.ImportacaoVendas.Services;

public record LinhaClassificada(LinhaRelatorio Linha, TipoRepasse? TipoRepasse);

public record RelatorioVendas(
    string Hash,
    string? PeriodoDe,
    string? PeriodoAte,
    IReadOnlyList<LinhaClassificada> Linhas);

/// <summary>
/// Lê o CSV de vendas e classifica cada linha. Fonte única para a prévia e
/// para a confirmação: o servidor nunca confia em valores vindos da tela.
/// </summary>
public class LeitorRelatorioVendas
{
    private readonly IVendasParser _parser;

    public LeitorRelatorioVendas(IVendasParser parser) => _parser = parser;

    public RelatorioVendas Ler(byte[] csv)
    {
        VendasParseResult resultado;
        try
        {
            resultado = _parser.Parse(csv);
        }
        catch (Exception ex)
        {
            throw new DomainException($"Falha ao processar o arquivo CSV: {ex.Message}");
        }

        if (resultado.Linhas.Count == 0)
            throw new DomainException("Nenhuma linha foi encontrada no CSV. Verifique se o arquivo é um relatório válido.");

        var linhas = resultado.Linhas
            .Select(l => new LinhaClassificada(l, ClassificadorLinhaVenda.ClassificarRepasse(l.Nome)))
            .ToList()
            .AsReadOnly();

        return new RelatorioVendas(resultado.Hash, resultado.PeriodoDe, resultado.PeriodoAte, linhas);
    }
}
