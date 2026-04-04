using CasaDiAna.Application.Common;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Estoque.Commands.CorrigirEstoque;

public class CorrigirEstoqueCommandHandler : IRequestHandler<CorrigirEstoqueCommand>
{
    private readonly IIngredienteRepository _ingredientes;
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificacaoEstoqueService _notificacaoService;

    public CorrigirEstoqueCommandHandler(
        IIngredienteRepository ingredientes,
        IMovimentacaoRepository movimentacoes,
        ICurrentUserService currentUser,
        INotificacaoEstoqueService notificacaoService)
    {
        _ingredientes = ingredientes;
        _movimentacoes = movimentacoes;
        _currentUser = currentUser;
        _notificacaoService = notificacaoService;
    }

    public async Task Handle(CorrigirEstoqueCommand request, CancellationToken ct)
    {
        var ingredientesAfetados = new List<Ingrediente>();

        foreach (var itemInput in request.Itens)
        {
            var ingrediente = await _ingredientes.ObterPorIdAsync(itemInput.IngredienteId, ct)
                ?? throw new DomainException($"Ingrediente '{itemInput.IngredienteId}' não encontrado.");

            var saldoAnterior = ingrediente.EstoqueAtual;
            var diferenca = itemInput.NovaQuantidade - saldoAnterior;

            if (diferenca == 0) continue;

            var tipo = diferenca > 0 ? TipoMovimentacao.AjustePositivo : TipoMovimentacao.AjusteNegativo;

            ingrediente.AtualizarEstoque(itemInput.NovaQuantidade, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);

            var obs = string.IsNullOrWhiteSpace(itemInput.Observacao)
                ? "Correção manual de estoque"
                : itemInput.Observacao;
            var movimentacao = Movimentacao.Criar(
                itemInput.IngredienteId,
                tipo,
                Math.Abs(diferenca),
                itemInput.NovaQuantidade,
                _currentUser.UsuarioId,
                referenciaTipo: "CorrecaoEstoque",
                referenciaId: null,
                observacoes: obs);

            await _movimentacoes.AdicionarAsync(movimentacao, ct);
            ingredientesAfetados.Add(ingrediente);
        }

        await _ingredientes.SalvarAsync(ct);

        foreach (var ing in ingredientesAfetados)
            await _notificacaoService.VerificarECriarAsync(ing, ct);
    }
}
