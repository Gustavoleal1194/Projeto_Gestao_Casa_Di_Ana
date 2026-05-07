using CasaDiAna.Application.Common;
using CasaDiAna.Application.Ingredientes.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Commands.CriarIngrediente;

public class CriarIngredienteCommandHandler : IRequestHandler<CriarIngredienteCommand, IngredienteDto>
{
    private readonly IIngredienteRepository _ingredientes;
    private readonly IUnidadeMedidaRepository _unidades;
    private readonly ICurrentUserService _currentUser;

    public CriarIngredienteCommandHandler(
        IIngredienteRepository ingredientes,
        IUnidadeMedidaRepository unidades,
        ICurrentUserService currentUser)
    {
        _ingredientes = ingredientes;
        _unidades = unidades;
        _currentUser = currentUser;
    }

    public async Task<IngredienteDto> Handle(CriarIngredienteCommand request, CancellationToken cancellationToken)
    {
        if (!await _unidades.ExisteAsync(request.UnidadeMedidaId, cancellationToken))
            throw new DomainException("Unidade de medida não encontrada.");

        if (request.CodigoInterno != null &&
            await _ingredientes.CodigoInternoExisteAsync(request.CodigoInterno, ct: cancellationToken))
            throw new DomainException($"Já existe um ingrediente com o código '{request.CodigoInterno}'.");

        var ingrediente = Ingrediente.Criar(
            request.Nome,
            request.UnidadeMedidaId,
            request.EstoqueMinimo,
            _currentUser.UsuarioId,
            request.CodigoInterno,
            request.CategoriaId,
            request.EstoqueMaximo,
            request.Observacoes,
            request.QuantidadeEmbalagem);

        await _ingredientes.AdicionarAsync(ingrediente, cancellationToken);
        await _ingredientes.SalvarAsync(cancellationToken);

        // Recarregar com navegações
        var salvo = await _ingredientes.ObterPorIdAsync(ingrediente.Id, cancellationToken);
        return ToDto(salvo!);
    }

    internal static IngredienteDto ToDto(Ingrediente i) => new(
        i.Id, i.Nome, i.CodigoInterno,
        i.CategoriaId, i.Categoria?.Nome,
        i.UnidadeMedidaId, i.UnidadeMedida?.Codigo ?? string.Empty,
        i.EstoqueAtual, i.EstoqueMinimo, i.EstoqueMaximo,
        i.EstaBaixoDoMinimo(), i.Observacoes, i.QuantidadeEmbalagem, i.Ativo, i.AtualizadoEm);
}
