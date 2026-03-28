using CasaDiAna.Application.Common;
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

    public CorrigirEstoqueCommandHandler(
        IIngredienteRepository ingredientes,
        IMovimentacaoRepository movimentacoes,
        ICurrentUserService currentUser)
    {
        _ingredientes = ingredientes;
        _movimentacoes = movimentacoes;
        _currentUser = currentUser;
    }

    public async Task Handle(CorrigirEstoqueCommand request, CancellationToken ct)
    {
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
        }

        await _ingredientes.SalvarAsync(ct);
    }
}
