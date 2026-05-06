using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Commands.IniciarInventario;
using CasaDiAna.Application.Inventarios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Commands.AdicionarItemInventario;

public class AdicionarItemInventarioCommandHandler : IRequestHandler<AdicionarItemInventarioCommand, InventarioDto>
{
    private readonly IInventarioRepository _inventarios;
    private readonly IIngredienteRepository _ingredientes;
    private readonly ICurrentUserService _currentUser;

    public AdicionarItemInventarioCommandHandler(
        IInventarioRepository inventarios,
        IIngredienteRepository ingredientes,
        ICurrentUserService currentUser)
    {
        _inventarios = inventarios;
        _ingredientes = ingredientes;
        _currentUser = currentUser;
    }

    public async Task<InventarioDto> Handle(
        AdicionarItemInventarioCommand request, CancellationToken cancellationToken)
    {
        var inventario = await _inventarios.ObterPorIdComItensAsync(request.InventarioId, cancellationToken)
            ?? throw new DomainException("Inventário não encontrado.");

        if (inventario.CriadoPor != _currentUser.UsuarioId && _currentUser.Papel != "Admin")
            throw new UnauthorizedAccessException("Acesso negado.");

        var ingrediente = await _ingredientes.ObterPorIdAsync(request.IngredienteId, cancellationToken)
            ?? throw new DomainException($"Ingrediente '{request.IngredienteId}' não encontrado.");

        if (!ingrediente.Ativo)
            throw new DomainException($"Ingrediente '{ingrediente.Nome}' está inativo.");

        inventario.AdicionarItem(
            request.IngredienteId,
            ingrediente.EstoqueAtual,
            request.QuantidadeContada,
            request.Observacoes);

        var novoItem = inventario.Itens.Last();
        await _inventarios.AdicionarItemAsync(novoItem, cancellationToken);
        await _inventarios.SalvarAsync(cancellationToken);

        var atualizado = await _inventarios.ObterPorIdComItensAsync(inventario.Id, cancellationToken);
        return IniciarInventarioCommandHandler.ToDto(atualizado!);
    }
}
