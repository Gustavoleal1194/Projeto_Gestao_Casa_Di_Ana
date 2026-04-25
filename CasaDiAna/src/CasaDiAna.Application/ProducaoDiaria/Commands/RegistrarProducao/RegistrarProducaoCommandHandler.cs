using CasaDiAna.Application.Common;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Application.ProducaoDiaria.Dtos;
using CasaDiAna.Domain.Entities;
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
    private readonly IIngredienteRepository _ingredientes;
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificacaoEstoqueService _notificacaoService;

    public RegistrarProducaoCommandHandler(
        IProducaoDiariaRepository producoes,
        IProdutoRepository produtos,
        IIngredienteRepository ingredientes,
        IMovimentacaoRepository movimentacoes,
        ICurrentUserService currentUser,
        INotificacaoEstoqueService notificacaoService)
    {
        _producoes = producoes;
        _produtos = produtos;
        _ingredientes = ingredientes;
        _movimentacoes = movimentacoes;
        _currentUser = currentUser;
        _notificacaoService = notificacaoService;
    }

    public async Task<ProducaoDiariaDto> Handle(
        RegistrarProducaoCommand request, CancellationToken cancellationToken)
    {
        // 1. Carrega produto com ficha técnica completa
        var produto = await _produtos.ObterPorIdComFichaAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        if (!produto.Ativo)
            throw new DomainException("Produto está inativo.");

        if (!produto.ItensFicha.Any())
            throw new DomainException(
                $"O produto '{produto.Nome}' não possui ficha técnica cadastrada. " +
                "Cadastre a ficha técnica antes de registrar a produção.");

        // 2. Carrega ingredientes da ficha técnica
        var ingredientesMap = new Dictionary<Guid, Ingrediente>();
        foreach (var item in produto.ItensFicha)
        {
            var ingrediente = await _ingredientes.ObterPorIdAsync(item.IngredienteId, cancellationToken)
                ?? throw new DomainException($"Ingrediente '{item.IngredienteId}' não encontrado.");

            ingredientesMap[item.IngredienteId] = ingrediente;
        }

        // 3. Calcula custo total e cria o registro de produção (gera o ID aqui)
        var custoFichaPorUnidade = produto.ItensFicha.Sum(i =>
            i.QuantidadePorUnidade * (ingredientesMap[i.IngredienteId].CustoUnitario ?? 0));
        var custoTotal = custoFichaPorUnidade * request.QuantidadeProduzida;

        var producao = Domain.Entities.ProducaoDiaria.Criar(
            request.ProdutoId,
            request.Data,
            request.QuantidadeProduzida,
            custoTotal,
            _currentUser.UsuarioId,
            request.Observacoes);

        // 4. Dá baixa no estoque e registra movimentações (usa producao.Id como referência)
        foreach (var item in produto.ItensFicha)
        {
            var ingrediente = ingredientesMap[item.IngredienteId];
            var quantidadeUsada = item.QuantidadePorUnidade * request.QuantidadeProduzida;
            var novoSaldo = ingrediente.EstoqueAtual - quantidadeUsada;

            ingrediente.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);

            var movimentacao = Movimentacao.Criar(
                item.IngredienteId,
                TipoMovimentacao.SaidaProducao,
                quantidadeUsada,
                ingrediente.EstoqueAtual,
                _currentUser.UsuarioId,
                referenciaTipo: "ProducaoDiaria",
                referenciaId: producao.Id);

            await _movimentacoes.AdicionarAsync(movimentacao, cancellationToken);
        }

        // 5. Persiste tudo em um único SaveChanges
        await _producoes.AdicionarAsync(producao, cancellationToken);
        await _producoes.SalvarAsync(cancellationToken);

        foreach (var ing in ingredientesMap.Values)
            await _notificacaoService.VerificarECriarAsync(ing, cancellationToken);

        return ToDto(producao, produto.Nome);
    }

    internal static ProducaoDiariaDto ToDto(Domain.Entities.ProducaoDiaria p, string produtoNome) =>
        new(p.Id, p.ProdutoId, produtoNome, p.Data,
            p.QuantidadeProduzida, p.CustoTotal, p.Observacoes, p.CriadoEm);
}
