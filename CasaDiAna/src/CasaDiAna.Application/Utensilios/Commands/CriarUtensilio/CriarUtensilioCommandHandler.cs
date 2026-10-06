using CasaDiAna.Application.Common;
using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;

public class CriarUtensilioCommandHandler : IRequestHandler<CriarUtensilioCommand, UtensilioDto>
{
    private readonly IUtensilioRepository _utensilios;
    private readonly IUnidadeMedidaRepository _unidades;
    private readonly ICurrentUserService _currentUser;

    public CriarUtensilioCommandHandler(
        IUtensilioRepository utensilios,
        IUnidadeMedidaRepository unidades,
        ICurrentUserService currentUser)
    {
        _utensilios = utensilios;
        _unidades = unidades;
        _currentUser = currentUser;
    }

    public async Task<UtensilioDto> Handle(CriarUtensilioCommand request, CancellationToken cancellationToken)
    {
        if (!await _unidades.ExisteAsync(request.UnidadeMedidaId, cancellationToken))
            throw new DomainException("Unidade de medida não encontrada.");

        if (request.CodigoInterno != null &&
            await _utensilios.CodigoInternoExisteAsync(request.CodigoInterno, ct: cancellationToken))
            throw new DomainException($"Já existe um utensílio com o código '{request.CodigoInterno}'.");

        var utensilio = Utensilio.Criar(
            request.Nome,
            request.UnidadeMedidaId,
            request.EstoqueMinimo,
            _currentUser.UsuarioId,
            request.CodigoInterno,
            request.CategoriaUtensilioId,
            request.EstoqueMaximo);

        await _utensilios.AdicionarAsync(utensilio, cancellationToken);
        await _utensilios.SalvarAsync(cancellationToken);

        var salvo = await _utensilios.ObterPorIdAsync(utensilio.Id, cancellationToken);
        return ToDto(salvo!);
    }

    internal static UtensilioDto ToDto(Utensilio u) => new(
        u.Id, u.Nome, u.CodigoInterno,
        u.CategoriaUtensilioId, u.Categoria?.Nome,
        u.UnidadeMedidaId, u.UnidadeMedida?.Codigo ?? string.Empty,
        u.EstoqueAtual, u.EstoqueMinimo, u.EstoqueMaximo,
        u.EstaBaixoDoMinimo(), u.CustoUnitario,
        u.Ativo, u.AtualizadoEm);
}
