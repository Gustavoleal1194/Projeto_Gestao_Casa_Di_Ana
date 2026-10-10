using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;

public class ProcessarPreviewVendasCommandHandler
    : IRequestHandler<ProcessarPreviewVendasCommand, PreviewImportacaoDto>
{
    private readonly IVendasParser _parser;
    private readonly IProdutoRepository _produtos;
    private readonly IImportacaoVendasRepository _importacoes;

    public ProcessarPreviewVendasCommandHandler(
        IVendasParser parser,
        IProdutoRepository produtos,
        IImportacaoVendasRepository importacoes)
    {
        _parser = parser;
        _produtos = produtos;
        _importacoes = importacoes;
    }

    public async Task<PreviewImportacaoDto> Handle(
        ProcessarPreviewVendasCommand request,
        CancellationToken cancellationToken)
    {
        VendasParseResult parseResult;
        try
        {
            parseResult = _parser.Parse(request.CsvBytes);
        }
        catch (Exception ex)
        {
            throw new DomainException($"Falha ao processar o arquivo CSV: {ex.Message}");
        }

        if (parseResult.Linhas.Count == 0)
            throw new DomainException("Nenhuma linha foi encontrada no CSV. Verifique se o arquivo é um relatório válido.");

        if (await _importacoes.HashExisteAsync(parseResult.Hash, cancellationToken))
            throw new DomainException("Este arquivo já foi importado anteriormente.");

        var todosProdutos = await _produtos.ListarAsync(apenasAtivos: false, cancellationToken);
        var produtosAtivos = todosProdutos.Where(p => p.Ativo).ToList();

        var itens = parseResult.Linhas
            .Select(linha => Match(linha, produtosAtivos))
            .ToList();

        decimal SomarRepasse(TipoRepasse tipo) =>
            itens.Where(i => i.TipoRepasse == tipo).Sum(i => i.ValorTotal);

        return new PreviewImportacaoDto(
            parseResult.Hash,
            parseResult.PeriodoDe,
            parseResult.PeriodoAte,
            TotalLinhasParseadas: parseResult.Linhas.Count,
            TotalMatched:   itens.Count(i => i.Status == StatusImportacao.Matched),
            TotalAmbiguous: itens.Count(i => i.Status == StatusImportacao.Ambiguous),
            TotalUnmatched: itens.Count(i => i.Status == StatusImportacao.Unmatched),
            TotalIgnored:   itens.Count(i => i.Status == StatusImportacao.Ignored),
            TotalRepasses:    itens.Count(i => i.Status == StatusImportacao.Repasse),
            TotalTaxaServico: SomarRepasse(TipoRepasse.TaxaServico),
            TotalEntregas:    SomarRepasse(TipoRepasse.Entrega),
            Itens: itens.AsReadOnly());
    }

    private static ItemPreviewDto Match(
        LinhaRelatorio linha,
        IReadOnlyList<CasaDiAna.Domain.Entities.Produto> produtos)
    {
        var tipoRepasse = ClassificadorLinhaVenda.ClassificarRepasse(linha.Nome);
        if (tipoRepasse is not null)
            return Repasse(linha, tipoRepasse.Value);

        var nomeNorm = NormalizadorNome.Normalizar(linha.Nome);

        var exatos = produtos
            .Where(p => NormalizadorNome.Normalizar(p.Nome) == nomeNorm)
            .ToList();

        if (exatos.Count == 1)
            return Matched(linha, exatos[0]);
        if (exatos.Count > 1)
            return Ambiguous(linha, exatos);

        return new ItemPreviewDto(
            linha.CodigoExterno, linha.Nome, linha.Grupo,
            linha.Quantidade, linha.ValorTotal,
            StatusImportacao.Unmatched,
            null, null, Array.Empty<SugestaoMatchDto>());
    }

    private static ItemPreviewDto Repasse(LinhaRelatorio linha, TipoRepasse tipo) =>
        new(linha.CodigoExterno, linha.Nome, linha.Grupo,
            linha.Quantidade, linha.ValorTotal,
            StatusImportacao.Repasse,
            null, null, Array.Empty<SugestaoMatchDto>(), tipo);

    private static ItemPreviewDto Matched(
        LinhaRelatorio linha,
        CasaDiAna.Domain.Entities.Produto produto) =>
        new(linha.CodigoExterno, linha.Nome, linha.Grupo,
            linha.Quantidade, linha.ValorTotal,
            StatusImportacao.Matched,
            produto.Id, produto.Nome, Array.Empty<SugestaoMatchDto>());

    private static ItemPreviewDto Ambiguous(
        LinhaRelatorio linha,
        IReadOnlyList<CasaDiAna.Domain.Entities.Produto> candidatos) =>
        new(linha.CodigoExterno, linha.Nome, linha.Grupo,
            linha.Quantidade, linha.ValorTotal,
            StatusImportacao.Ambiguous,
            null, null,
            candidatos.Select(p => new SugestaoMatchDto(p.Id, p.Nome)).ToList().AsReadOnly());
}
