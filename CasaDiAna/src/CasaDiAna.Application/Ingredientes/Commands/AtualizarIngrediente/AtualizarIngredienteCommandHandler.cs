using CasaDiAna.Application.Common;
using CasaDiAna.Application.Ingredientes.Commands.CriarIngrediente;
using CasaDiAna.Application.Ingredientes.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Commands.AtualizarIngrediente;

public class AtualizarIngredienteCommandHandler : IRequestHandler<AtualizarIngredienteCommand, IngredienteDto>
{
    private readonly IIngredienteRepository _ingredientes;
    private readonly IUnidadeMedidaRepository _unidades;
    private readonly ICurrentUserService _currentUser;

    public AtualizarIngredienteCommandHandler(
        IIngredienteRepository ingredientes,
        IUnidadeMedidaRepository unidades,
        ICurrentUserService currentUser)
    {
        _ingredientes = ingredientes;
        _unidades = unidades;
        _currentUser = currentUser;
    }

    public async Task<IngredienteDto> Handle(AtualizarIngredienteCommand request, CancellationToken cancellationToken)
    {
        var ingrediente = await _ingredientes.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Ingrediente não encontrado.");

        if (!await _unidades.ExisteAsync(request.UnidadeMedidaId, cancellationToken))
            throw new DomainException("Unidade de medida não encontrada.");

        if (request.CodigoInterno != null &&
            await _ingredientes.CodigoInternoExisteAsync(request.CodigoInterno, ignorarId: request.Id, ct: cancellationToken))
            throw new DomainException($"Já existe um ingrediente com o código '{request.CodigoInterno}'.");

        ingrediente.Atualizar(
            request.Nome,
            request.UnidadeMedidaId,
            request.EstoqueMinimo,
            _currentUser.UsuarioId,
            request.CodigoInterno,
            request.CategoriaId,
            request.EstoqueMaximo,
            request.Observacoes,
            request.QuantidadeEmbalagem);

        _ingredientes.Atualizar(ingrediente);
        await _ingredientes.SalvarAsync(cancellationToken);

        var salvo = await _ingredientes.ObterPorIdAsync(ingrediente.Id, cancellationToken);
        return CriarIngredienteCommandHandler.ToDto(salvo!);
    }
}
