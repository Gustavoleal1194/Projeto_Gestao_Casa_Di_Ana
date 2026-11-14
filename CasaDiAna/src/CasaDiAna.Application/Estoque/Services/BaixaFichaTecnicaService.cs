using CasaDiAna.Application.Common;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;

namespace CasaDiAna.Application.Estoque.Services;

/// <summary>
/// Única implementação de "consumir os insumos da ficha técnica": baixa o estoque
/// de cada ingrediente, registra a <see cref="Movimentacao"/> com a referência de
/// origem e devolve o custo consumido.
/// <para>
/// Escopo por requisição: mantém em cache os ingredientes carregados, para que
/// operações em lote (importação de vendas) não consultem o mesmo ingrediente
/// várias vezes e acumulem o saldo corretamente. Não persiste: quem chama
/// controla o <c>SaveChanges</c> e depois chama <see cref="NotificarEstoqueBaixoAsync"/>.
/// </para>
/// </summary>
public sealed class BaixaFichaTecnicaService
{
    private readonly IIngredienteRepository _ingredientes;
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly INotificacaoEstoqueService _notificacoes;
    private readonly ICurrentUserService _currentUser;
    private readonly Dictionary<Guid, Ingrediente> _afetados = new();

    public BaixaFichaTecnicaService(
        IIngredienteRepository ingredientes,
        IMovimentacaoRepository movimentacoes,
        INotificacaoEstoqueService notificacoes,
        ICurrentUserService currentUser)
    {
        _ingredientes = ingredientes;
        _movimentacoes = movimentacoes;
        _notificacoes = notificacoes;
        _currentUser = currentUser;
    }

    /// <returns>Custo total dos insumos consumidos, pelo custo unitário atual.</returns>
    public async Task<decimal> BaixarAsync(
        Produto produto,
        decimal quantidade,
        TipoMovimentacao tipo,
        string referenciaTipo,
        Guid referenciaId,
        CancellationToken ct)
    {
        if (!produto.TemFichaTecnica)
            throw new InvalidOperationException(
                $"Produto '{produto.Nome}' sem ficha técnica não pode ter insumos baixados.");

        decimal custoTotal = 0;
        foreach (var item in produto.ItensFicha)
        {
            var ingrediente = await ObterIngredienteAsync(item.IngredienteId, ct);
            var quantidadeUsada = item.QuantidadePorUnidade * quantidade;
            custoTotal += quantidadeUsada * (ingrediente.CustoUnitario ?? 0);

            ingrediente.AtualizarEstoque(ingrediente.EstoqueAtual - quantidadeUsada, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);

            await _movimentacoes.AdicionarAsync(
                Movimentacao.Criar(
                    item.IngredienteId,
                    tipo,
                    quantidadeUsada,
                    ingrediente.EstoqueAtual,
                    _currentUser.UsuarioId,
                    referenciaTipo,
                    referenciaId),
                ct);
        }
        return custoTotal;
    }

    /// <summary>
    /// Consome os insumos de uma venda quando o produto é feito na hora e tem ficha;
    /// registra o custo na própria venda.
    /// </summary>
    /// <returns><c>false</c> se o produto não baixa insumos na venda ou está sem ficha.</returns>
    public async Task<bool> BaixarVendaAsync(Produto produto, VendaDiaria venda, CancellationToken ct)
    {
        if (!produto.BaixaInsumosNaVenda || !produto.TemFichaTecnica)
            return false;

        var custo = await BaixarAsync(
            produto, venda.QuantidadeVendida, TipoMovimentacao.SaidaVenda, nameof(VendaDiaria), venda.Id, ct);
        venda.RegistrarCustoInsumos(custo);
        return true;
    }

    /// <summary>Chamar após o <c>SaveChanges</c>: avalia alertas dos ingredientes baixados.</summary>
    public async Task NotificarEstoqueBaixoAsync(CancellationToken ct)
    {
        foreach (var ingrediente in _afetados.Values)
            await _notificacoes.VerificarECriarAsync(ingrediente, ct);
    }

    private async Task<Ingrediente> ObterIngredienteAsync(Guid id, CancellationToken ct)
    {
        if (_afetados.TryGetValue(id, out var cache))
            return cache;

        var ingrediente = await _ingredientes.ObterPorIdAsync(id, ct)
            ?? throw new DomainException($"Ingrediente '{id}' da ficha técnica não encontrado.");
        _afetados[id] = ingrediente;
        return ingrediente;
    }
}
