using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;

public class ProcessarPreviewPdfVendasCommandHandler
    : IRequestHandler<ProcessarPreviewPdfVendasCommand, PreviewImportacaoDto>
{
    private readonly IPdfVendasParser _parser;
    private readonly IProdutoRepository _produtos;
    private readonly IImportacaoVendasRepository _importacoes;

    public ProcessarPreviewPdfVendasCommandHandler(
        IPdfVendasParser parser,
        IProdutoRepository produtos,
        IImportacaoVendasRepository importacoes)
    {
        _parser = parser;
        _produtos = produtos;
        _importacoes = importacoes;
    }

    public async Task<PreviewImportacaoDto> Handle(
        ProcessarPreviewPdfVendasCommand request,
        CancellationToken cancellationToken)
    {
        PdfParseResult parseResult;
        try
        {
            parseResult = _parser.Parse(request.PdfBytes);
        }
        catch (Exception ex)
        {
            throw new DomainException($"Falha ao processar o PDF: {ex.Message}");
        }

        if (parseResult.Linhas.Count == 0)
            throw new DomainException("Nenhuma linha de produto foi encontrada no PDF. Verifique se o arquivo é um relatório válido.");

        if (await _importacoes.HashExisteAsync(parseResult.Hash, cancellationToken))
            throw new DomainException("Este arquivo já foi importado anteriormente.");

        var todosProdutos = await _produtos.ListarAsync(apenasAtivos: false, cancellationToken);
        var produtosAtivos = todosProdutos.Where(p => p.Ativo).ToList();

        var itens = parseResult.Linhas
            .Select(linha => Match(linha, produtosAtivos))
            .ToList();

        return new PreviewImportacaoDto(
            parseResult.Hash,
            parseResult.PeriodoDe,
            parseResult.PeriodoAte,
            TotalLinhasParseadas: parseResult.Linhas.Count,
            TotalMatched:   itens.Count(i => i.Status == StatusImportacao.Matched),
            TotalAmbiguous: itens.Count(i => i.Status == StatusImportacao.Ambiguous),
            TotalUnmatched: itens.Count(i => i.Status == StatusImportacao.Unmatched),
            TotalIgnored:   itens.Count(i => i.Status == StatusImportacao.Ignored),
            Itens: itens.AsReadOnly());
    }

    private static ItemPreviewDto Match(
        LinhaRelatorio linha,
        IReadOnlyList<CasaDiAna.Domain.Entities.Produto> produtos)
    {
        if (IsIgnorado(linha.Nome))
        {
            return new ItemPreviewDto(
                linha.CodigoExterno, linha.Nome, linha.Grupo,
                linha.Quantidade, linha.ValorTotal,
                StatusImportacao.Ignored,
                null, null, Array.Empty<SugestaoMatchDto>());
        }

        var nomeNorm = Normalizar(linha.Nome);

        var exatos = produtos
            .Where(p => Normalizar(p.Nome) == nomeNorm)
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

    private static string Normalizar(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return string.Empty;
        var formD = s.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);
        foreach (var c in formD)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        return Regex.Replace(
            sb.ToString().Normalize(NormalizationForm.FormC)
              .ToLowerInvariant()
              .Replace("-", " ").Replace("/", " ")
              .Replace("(", "").Replace(")", "").Replace(".", ""),
            @"\s+", " ").Trim();
    }

    private static readonly HashSet<string> _ignorados = new(StringComparer.OrdinalIgnoreCase)
    {
        "taxa de servico", "taxa servico", "entrega", "diversos valor",
        "diversos", "acrescimo", "gorjeta", "desconto", "couvert",
    };

    private static bool IsIgnorado(string nome) => _ignorados.Contains(Normalizar(nome));
}
