using CasaDiAna.Application.Common;
using CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;
using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.AtualizarUtensilio;

public class AtualizarUtensilioCommandHandler : IRequestHandler<AtualizarUtensilioCommand, UtensilioDto>
{
    private readonly IUtensilioRepository _utensilios;
    private readonly IUnidadeMedidaRepository _unidades;
    private readonly ICurrentUserService _currentUser;

    public AtualizarUtensilioCommandHandler(
        IUtensilioRepository utensilios,
        IUnidadeMedidaRepository unidades,
        ICurrentUserService currentUser)
    {
        _utensilios = utensilios;
        _unidades = unidades;
        _currentUser = currentUser;
    }

    public async Task<UtensilioDto> Handle(AtualizarUtensilioCommand request, CancellationToken cancellationToken)
    {
        var utensilio = await _utensilios.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Utensílio não encontrado.");

        if (!await _unidades.ExisteAsync(request.UnidadeMedidaId, cancellationToken))
            throw new DomainException("Unidade de medida não encontrada.");

        if (request.CodigoInterno != null &&
            await _utensilios.CodigoInternoExisteAsync(request.CodigoInterno, ignorarId: request.Id, ct: cancellationToken))
            throw new DomainException($"Já existe um utensílio com o código '{request.CodigoInterno}'.");

        utensilio.Atualizar(
            request.Nome,
            request.UnidadeMedidaId,
            request.EstoqueMinimo,
            _currentUser.UsuarioId,
            request.CodigoInterno,
            request.CategoriaUtensilioId,
            request.EstoqueMaximo);

        _utensilios.Atualizar(utensilio);
        await _utensilios.SalvarAsync(cancellationToken);

        var salvo = await _utensilios.ObterPorIdAsync(utensilio.Id, cancellationToken);
        return CriarUtensilioCommandHandler.ToDto(salvo!);
    }
}
