using CasaDiAna.Application.Estoque.Services;
using CasaDiAna.Application.ProducaoDiaria.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.ProducaoDiaria.Commands.RegistrarProducao;

public class RegistrarProducaoCommandHandler
    : IRequestHandler<RegistrarProducaoCommand, ProducaoDiariaDto>
{
    private readonly IProducaoDiariaRepository _producoes;
    private readonly IProdutoRepository _produtos;
    private readonly BaixaFichaTecnicaService _baixaFicha;
    private readonly ICurrentUserService _currentUser;

    public RegistrarProducaoCommandHandler(
        IProducaoDiariaRepository producoes,
        IProdutoRepository produtos,
        BaixaFichaTecnicaService baixaFicha,
        ICurrentUserService currentUser)
    {
        _producoes = producoes;
        _produtos = produtos;
        _baixaFicha = baixaFicha;
        _currentUser = currentUser;
    }

    public async Task<ProducaoDiariaDto> Handle(
        RegistrarProducaoCommand request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdComFichaAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");
        produto.GarantirPodeSerProduzido();

        var producao = Domain.Entities.ProducaoDiaria.Criar(
            request.ProdutoId,
            request.Data,
            request.QuantidadeProduzida,
            _currentUser.UsuarioId,
            request.Observacoes);

        var custo = await _baixaFicha.BaixarAsync(
            produto, request.QuantidadeProduzida, TipoMovimentacao.SaidaProducao,
            nameof(Domain.Entities.ProducaoDiaria), producao.Id, cancellationToken);
        producao.RegistrarCustoInsumos(custo);

        // Produção, baixas e movimentações num único SaveChanges.
        await _producoes.AdicionarAsync(producao, cancellationToken);
        await _producoes.SalvarAsync(cancellationToken);
        await _baixaFicha.NotificarEstoqueBaixoAsync(cancellationToken);

        return ToDto(producao, produto.Nome);
    }

    internal static ProducaoDiariaDto ToDto(Domain.Entities.ProducaoDiaria p, string produtoNome) =>
        new(p.Id, p.ProdutoId, produtoNome, p.Data,
            p.QuantidadeProduzida, p.CustoTotal, p.Observacoes, p.CriadoEm);
}
