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
    private readonly IUtensilioRepository _utensilios;
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly IMovimentacaoUtensilioRepository _movimentacoesUtensilio;
    private readonly ICurrentUserService _currentUser;

    public CancelarEntradaCommandHandler(
        IEntradaMercadoriaRepository entradas,
        IIngredienteRepository ingredientes,
        IUtensilioRepository utensilios,
        IMovimentacaoRepository movimentacoes,
        IMovimentacaoUtensilioRepository movimentacoesUtensilio,
        ICurrentUserService currentUser)
    {
        _entradas = entradas;
        _ingredientes = ingredientes;
        _utensilios = utensilios;
        _movimentacoes = movimentacoes;
        _movimentacoesUtensilio = movimentacoesUtensilio;
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

        foreach (var item in entrada.ItensUtensilio)
        {
            var utensilio = await _utensilios.ObterPorIdAsync(item.UtensilioId, cancellationToken)
                ?? throw new DomainException($"Utensílio '{item.UtensilioId}' não encontrado.");

            var novoSaldo = utensilio.EstoqueAtual - item.Quantidade;
            utensilio.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            _utensilios.Atualizar(utensilio);

            var movimentacaoUtensilio = MovimentacaoUtensilio.Criar(
                item.UtensilioId,
                TipoMovimentacao.AjusteNegativo,
                item.Quantidade,
                utensilio.EstoqueAtual,
                _currentUser.UsuarioId,
                referenciaTipo: "CancelamentoEntrada",
                referenciaId: entrada.Id);

            await _movimentacoesUtensilio.AdicionarAsync(movimentacaoUtensilio, cancellationToken);
        }

        _entradas.Atualizar(entrada);
        await _entradas.SalvarAsync(cancellationToken);

        var salva = await _entradas.ObterPorIdComItensAsync(entrada.Id, cancellationToken);
        return RegistrarEntradaCommandHandler.ToDto(salva!);
    }
}
