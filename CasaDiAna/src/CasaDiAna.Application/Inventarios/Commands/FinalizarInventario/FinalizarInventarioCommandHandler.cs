using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Commands.IniciarInventario;
using CasaDiAna.Application.Inventarios.Dtos;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Commands.FinalizarInventario;

public class FinalizarInventarioCommandHandler : IRequestHandler<FinalizarInventarioCommand, InventarioDto>
{
    private readonly IInventarioRepository _inventarios;
    private readonly IIngredienteRepository _ingredientes;
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificacaoEstoqueService _notificacaoService;

    public FinalizarInventarioCommandHandler(
        IInventarioRepository inventarios,
        IIngredienteRepository ingredientes,
        IMovimentacaoRepository movimentacoes,
        ICurrentUserService currentUser,
        INotificacaoEstoqueService notificacaoService)
    {
        _inventarios = inventarios;
        _ingredientes = ingredientes;
        _movimentacoes = movimentacoes;
        _currentUser = currentUser;
        _notificacaoService = notificacaoService;
    }

    public async Task<InventarioDto> Handle(
        FinalizarInventarioCommand request, CancellationToken cancellationToken)
    {
        var inventario = await _inventarios.ObterPorIdComItensAsync(request.InventarioId, cancellationToken)
            ?? throw new DomainException("Inventário não encontrado.");

        var ingredientesAfetados = new List<Ingrediente>();

        foreach (var item in inventario.Itens.Where(i => i.Diferenca != 0))
        {
            var ingrediente = await _ingredientes.ObterPorIdAsync(item.IngredienteId, cancellationToken)
                ?? throw new DomainException($"Ingrediente '{item.IngredienteId}' não encontrado.");

            var novoSaldo = ingrediente.EstoqueAtual + item.Diferenca;
            ingrediente.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);

            var tipo = item.Diferenca > 0 ? TipoMovimentacao.AjustePositivo : TipoMovimentacao.AjusteNegativo;
            var movimentacao = Movimentacao.Criar(
                item.IngredienteId,
                tipo,
                Math.Abs(item.Diferenca),
                ingrediente.EstoqueAtual,
                _currentUser.UsuarioId,
                referenciaTipo: "Inventario",
                referenciaId: inventario.Id);

            await _movimentacoes.AdicionarAsync(movimentacao, cancellationToken);
            ingredientesAfetados.Add(ingrediente);
        }

        inventario.Finalizar(_currentUser.UsuarioId);
        _inventarios.Atualizar(inventario);
        await _inventarios.SalvarAsync(cancellationToken);

        foreach (var ing in ingredientesAfetados)
            await _notificacaoService.VerificarECriarAsync(ing, cancellationToken);

        var finalizado = await _inventarios.ObterPorIdComItensAsync(inventario.Id, cancellationToken);
        return IniciarInventarioCommandHandler.ToDto(finalizado!);
    }
}
