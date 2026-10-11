using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Application.ImportacaoVendas.Services;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;
using ConfiguracaoRepasse = CasaDiAna.Domain.Entities.ConfiguracaoRepasse;
using EntidadeImportacao = CasaDiAna.Domain.Entities.ImportacaoVendas;
using Produto = CasaDiAna.Domain.Entities.Produto;
using VendaDiaria = CasaDiAna.Domain.Entities.VendaDiaria;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

public class ConfirmarImportacaoCommandHandler
    : IRequestHandler<ConfirmarImportacaoCommand, ResultadoImportacaoDto>
{
    private readonly LeitorRelatorioVendas _leitor;
    private readonly IVendaDiariaRepository _vendas;
    private readonly IProdutoRepository _produtos;
    private readonly IImportacaoVendasRepository _importacoes;
    private readonly IConfiguracaoRepasseRepository _configuracaoRepasse;
    private readonly ICurrentUserService _currentUser;

    public ConfirmarImportacaoCommandHandler(
        LeitorRelatorioVendas leitor,
        IVendaDiariaRepository vendas,
        IProdutoRepository produtos,
        IImportacaoVendasRepository importacoes,
        IConfiguracaoRepasseRepository configuracaoRepasse,
        ICurrentUserService currentUser)
    {
        _leitor = leitor;
        _vendas = vendas;
        _produtos = produtos;
        _importacoes = importacoes;
        _configuracaoRepasse = configuracaoRepasse;
        _currentUser = currentUser;
    }

    public async Task<ResultadoImportacaoDto> Handle(
        ConfirmarImportacaoCommand request,
        CancellationToken cancellationToken)
    {
        var relatorio = _leitor.Ler(request.CsvBytes);

        if (await _importacoes.HashExisteAsync(relatorio.Hash, cancellationToken))
            throw new DomainException("Este arquivo já foi importado anteriormente.");

        var produtos = (await _produtos.ListarAsync(apenasAtivos: false, cancellationToken))
            .ToDictionary(p => p.Id);
        var vinculos = request.Vinculos
            .GroupBy(v => v.NomeRelatorio, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.Last().ProdutoId, StringComparer.Ordinal);
        var removidas = request.LinhasRemovidas.ToHashSet(StringComparer.Ordinal);

        ValidarDecisoes(relatorio, vinculos, removidas, produtos);

        var novasVendas = new List<VendaDiaria>();
        decimal totalTaxaServico = 0, totalEntregas = 0;
        int totalIgnoradas = 0, totalNaoEncontradas = 0;

        foreach (var (linha, tipoRepasse) in relatorio.Linhas)
        {
            if (removidas.Contains(linha.Nome)) { totalIgnoradas++; continue; }

            switch (tipoRepasse)
            {
                case TipoRepasse.TaxaServico: totalTaxaServico += linha.ValorTotal; continue;
                case TipoRepasse.Entrega: totalEntregas += linha.ValorTotal; continue;
            }

            if (!vinculos.TryGetValue(linha.Nome, out var produtoId)) { totalNaoEncontradas++; continue; }

            if (linha.Quantidade > 0)
                novasVendas.Add(VendaDiaria.Criar(produtoId, request.DataVenda, linha.Quantidade, _currentUser.UsuarioId));
        }

        if (novasVendas.Count == 0 && totalTaxaServico == 0 && totalEntregas == 0)
            throw new DomainException("Nenhum item ou repasse confirmado para importação.");

        await _vendas.AdicionarRangeAsync(novasVendas, cancellationToken);

        // Snapshot dos percentuais vigentes: mudar a configuração depois não
        // recalcula importações antigas. Sem configuração salva, vale o padrão.
        var configuracaoRepasse = await _configuracaoRepasse.ObterAsync(cancellationToken)
            ?? ConfiguracaoRepasse.Padrao(_currentUser.UsuarioId);

        var importacao = EntidadeImportacao.Criar(
            request.NomeArquivo,
            relatorio.Hash,
            relatorio.PeriodoDe,
            relatorio.PeriodoAte,
            relatorio.Linhas.Count,
            totalImportadas: novasVendas.Count,
            totalIgnoradas,
            totalNaoEncontradas,
            request.DataVenda,
            totalTaxaServico,
            totalEntregas,
            configuracaoRepasse,
            _currentUser.UsuarioId);

        await _importacoes.AdicionarAsync(importacao, cancellationToken);
        await _vendas.SalvarAsync(cancellationToken);

        return new ResultadoImportacaoDto(
            novasVendas.Count,
            totalIgnoradas,
            totalNaoEncontradas,
            importacao.TotalTaxaServico,
            importacao.TotalEntregas);
    }

    private static void ValidarDecisoes(
        RelatorioVendas relatorio,
        IReadOnlyDictionary<string, Guid> vinculos,
        IReadOnlySet<string> removidas,
        IReadOnlyDictionary<Guid, Produto> produtos)
    {
        var tipoPorNome = relatorio.Linhas
            .GroupBy(l => l.Linha.Nome, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.First().TipoRepasse, StringComparer.Ordinal);

        var erros = new List<string>();

        foreach (var nome in vinculos.Keys.Concat(removidas).Distinct(StringComparer.Ordinal))
            if (!tipoPorNome.ContainsKey(nome))
                erros.Add($"Linha '{nome}' não existe no arquivo.");

        foreach (var (nome, produtoId) in vinculos)
        {
            if (removidas.Contains(nome))
                erros.Add($"Linha '{nome}' foi vinculada e removida ao mesmo tempo.");
            if (tipoPorNome.TryGetValue(nome, out var tipo) && tipo is not null)
                erros.Add($"Linha '{nome}' é um repasse e não pode virar venda de produto.");
            if (!produtos.TryGetValue(produtoId, out var produto))
                erros.Add($"Produto {produtoId} não encontrado.");
            else if (!produto.Ativo)
                erros.Add($"Produto '{produto.Nome}' está inativo.");
        }

        if (erros.Count > 0)
            throw new DomainException(string.Join(" | ", erros));
    }
}
