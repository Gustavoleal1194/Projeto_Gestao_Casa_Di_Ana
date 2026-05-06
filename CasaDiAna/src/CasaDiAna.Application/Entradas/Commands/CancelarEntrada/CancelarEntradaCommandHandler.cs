using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.CancelarEntrada;

public class CancelarEntradaCommandHandler : IRequestHandler<CancelarEntradaCommand, EntradaMercadoriaDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;
    private readonly IIngredienteRepository _ingredientes;
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly ICurrentUserService _currentUser;

    public CancelarEntradaCommandHandler(
        IEntradaMercadoriaRepository entradas,
        IIngredienteRepository ingredientes,
        IMovimentacaoRepository movimentacoes,
        ICurrentUserService currentUser)
    {
        _entradas = entradas;
        _ingredientes = ingredientes;
        _movimentacoes = movimentacoes;
        _currentUser = currentUser;
    }

    public async Task<EntradaMercadoriaDto> Handle(
        CancelarEntradaCommand request, CancellationToken cancellationToken)
    {
        var entrada = await _entradas.ObterPorIdComItensAsync(request.EntradaId, cancellationToken)
            ?? throw new DomainException("Entrada não encontrada.");

        if (entrada.CriadoPor != _currentUser.UsuarioId && _currentUser.Papel != "Admin")
            throw new UnauthorizedAccessException("Acesso negado.");

        entrada.Cancelar(_currentUser.UsuarioId);

        foreach (var item in entrada.Itens)
        {
            var ingrediente = await _ingredientes.ObterPorIdAsync(item.IngredienteId, cancellationToken)
                ?? throw new DomainException($"Ingrediente '{item.IngredienteId}' não encontrado.");

            var novoSaldo = ingrediente.EstoqueAtual - item.Quantidade;
            ingrediente.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);

            var movimentacao = Movimentacao.Criar(
                item.IngredienteId,
                TipoMovimentacao.AjusteNegativo,
                item.Quantidade,
                ingrediente.EstoqueAtual,
                _currentUser.UsuarioId,
                referenciaTipo: "CancelamentoEntrada",
                referenciaId: entrada.Id);

            await _movimentacoes.AdicionarAsync(movimentacao, cancellationToken);
        }

        _entradas.Atualizar(entrada);
        await _entradas.SalvarAsync(cancellationToken);

        var salva = await _entradas.ObterPorIdComItensAsync(entrada.Id, cancellationToken);
        return RegistrarEntradaCommandHandler.ToDto(salva!);
    }
}
