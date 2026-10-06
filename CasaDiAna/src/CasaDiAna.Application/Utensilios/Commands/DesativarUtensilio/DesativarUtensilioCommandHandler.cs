using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Commands.DesativarUtensilio;

public class DesativarUtensilioCommandHandler : IRequestHandler<DesativarUtensilioCommand>
{
    private readonly IUtensilioRepository _utensilios;
    private readonly ICurrentUserService _currentUser;

    public DesativarUtensilioCommandHandler(
        IUtensilioRepository utensilios,
        ICurrentUserService currentUser)
    {
        _utensilios = utensilios;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarUtensilioCommand request, CancellationToken cancellationToken)
    {
        var utensilio = await _utensilios.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Utensílio não encontrado.");

        utensilio.Desativar(_currentUser.UsuarioId);
        _utensilios.Atualizar(utensilio);
        await _utensilios.SalvarAsync(cancellationToken);
    }
}
