using CasaDiAna.Application.Common;
using CasaDiAna.Application.ImportacaoVendas.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;
using EntidadeImportacao = CasaDiAna.Domain.Entities.ImportacaoVendas;
using VendaDiaria = CasaDiAna.Domain.Entities.VendaDiaria;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

public class ConfirmarImportacaoCommandHandler
    : IRequestHandler<ConfirmarImportacaoCommand, ResultadoImportacaoDto>
{
    private readonly IVendaDiariaRepository _vendas;
    private readonly IProdutoRepository _produtos;
    private readonly IImportacaoVendasRepository _importacoes;
    private readonly ICurrentUserService _currentUser;

    public ConfirmarImportacaoCommandHandler(
        IVendaDiariaRepository vendas,
        IProdutoRepository produtos,
        IImportacaoVendasRepository importacoes,
        ICurrentUserService currentUser)
    {
        _vendas = vendas;
        _produtos = produtos;
        _importacoes = importacoes;
        _currentUser = currentUser;
    }

    public async Task<ResultadoImportacaoDto> Handle(
        ConfirmarImportacaoCommand request,
        CancellationToken cancellationToken)
    {
        if (await _importacoes.HashExisteAsync(request.Hash, cancellationToken))
            throw new DomainException("Este arquivo já foi importado anteriormente.");

        var produtoIds = request.Itens.Select(i => i.ProdutoId).Distinct().ToList();
        var todosProdutos = await _produtos.ListarAsync(apenasAtivos: false, cancellationToken);
        var produtosDict = todosProdutos
            .Where(p => produtoIds.Contains(p.Id))
            .ToDictionary(p => p.Id);

        var erros = new List<string>();
        foreach (var id in produtoIds)
        {
            if (!produtosDict.TryGetValue(id, out var produto))
                erros.Add($"Produto {id} não encontrado.");
            else if (!produto.Ativo)
                erros.Add($"Produto '{produto.Nome}' está inativo.");
        }

        if (erros.Count > 0)
            throw new DomainException(string.Join(" | ", erros));

        var novasVendas = request.Itens
            .Select(item => VendaDiaria.Criar(
                item.ProdutoId,
                request.DataVenda,
                item.Quantidade,
                _currentUser.UsuarioId))
            .ToList();

        await _vendas.AdicionarRangeAsync(novasVendas, cancellationToken);

        var importacao = EntidadeImportacao.Criar(
            request.NomeArquivo,
            request.Hash,
            request.PeriodoDe,
            request.PeriodoAte,
            request.TotalLinhasParseadas,
            totalImportadas: novasVendas.Count,
            request.TotalIgnoradas,
            request.TotalNaoEncontradas,
            _currentUser.UsuarioId);

        await _importacoes.AdicionarAsync(importacao, cancellationToken);

        await _vendas.SalvarAsync(cancellationToken);

        return new ResultadoImportacaoDto(
            novasVendas.Count,
            request.TotalIgnoradas,
            request.TotalNaoEncontradas);
    }
}
