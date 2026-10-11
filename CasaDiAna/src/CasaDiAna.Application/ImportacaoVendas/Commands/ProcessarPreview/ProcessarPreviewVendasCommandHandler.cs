using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ProcessarPreview;

public class ProcessarPreviewVendasCommandHandler
    : IRequestHandler<ProcessarPreviewVendasCommand, PreviewImportacaoDto>
{
    private readonly LeitorRelatorioVendas _leitor;
    private readonly IProdutoRepository _produtos;
    private readonly IImportacaoVendasRepository _importacoes;

    public ProcessarPreviewVendasCommandHandler(
        LeitorRelatorioVendas leitor,
        IProdutoRepository produtos,
        IImportacaoVendasRepository importacoes)
    {
        _leitor = leitor;
        _produtos = produtos;
        _importacoes = importacoes;
    }

    public async Task<PreviewImportacaoDto> Handle(
        ProcessarPreviewVendasCommand request,
        CancellationToken cancellationToken)
    {
        var relatorio = _leitor.Ler(request.CsvBytes);

        if (await _importacoes.HashExisteAsync(relatorio.Hash, cancellationToken))
            throw new DomainException("Este arquivo já foi importado anteriormente.");

        var todosProdutos = await _produtos.ListarAsync(apenasAtivos: false, cancellationToken);
        var produtosAtivos = todosProdutos.Where(p => p.Ativo).ToList();

        var itens = relatorio.Linhas
            .Select(l => l.TipoRepasse is { } tipo
                ? Repasse(l.Linha, tipo)
                : Match(l.Linha, produtosAtivos))
            .ToList();

        decimal SomarRepasse(TipoRepasse tipo) =>
            itens.Where(i => i.TipoRepasse == tipo).Sum(i => i.ValorTotal);

        return new PreviewImportacaoDto(
            relatorio.Hash,
            relatorio.PeriodoDe,
            relatorio.PeriodoAte,
            TotalLinhasParseadas: relatorio.Linhas.Count,
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
