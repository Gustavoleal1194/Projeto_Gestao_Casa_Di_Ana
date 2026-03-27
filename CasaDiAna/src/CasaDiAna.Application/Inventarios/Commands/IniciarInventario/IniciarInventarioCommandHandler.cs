using CasaDiAna.Application.Common;
using CasaDiAna.Application.Inventarios.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Commands.IniciarInventario;

public class IniciarInventarioCommandHandler : IRequestHandler<IniciarInventarioCommand, InventarioDto>
{
    private readonly IInventarioRepository _inventarios;
    private readonly ICurrentUserService _currentUser;

    public IniciarInventarioCommandHandler(
        IInventarioRepository inventarios,
        ICurrentUserService currentUser)
    {
        _inventarios = inventarios;
        _currentUser = currentUser;
    }

    public async Task<InventarioDto> Handle(
        IniciarInventarioCommand request, CancellationToken cancellationToken)
    {
        var inventario = Inventario.Criar(
            request.DataRealizacao,
            _currentUser.UsuarioId,
            request.Descricao,
            request.Observacoes);

        await _inventarios.AdicionarAsync(inventario, cancellationToken);
        await _inventarios.SalvarAsync(cancellationToken);

        var salvo = await _inventarios.ObterPorIdComItensAsync(inventario.Id, cancellationToken);
        return ToDto(salvo!);
    }

    internal static InventarioDto ToDto(Inventario inv)
    {
        var itens = inv.Itens.Select(i => new ItemInventarioDto(
            i.Id,
            i.IngredienteId,
            i.Ingrediente?.Nome ?? string.Empty,
            i.Ingrediente?.UnidadeMedida?.Codigo ?? string.Empty,
            i.QuantidadeSistema,
            i.QuantidadeContada,
            i.Diferenca,
            i.Observacoes)).ToList().AsReadOnly();

        return new InventarioDto(
            inv.Id,
            inv.DataRealizacao,
            inv.Descricao,
            inv.Status.ToString(),
            inv.Observacoes,
            inv.FinalizadoEm,
            itens,
            inv.CriadoEm);
    }
}
