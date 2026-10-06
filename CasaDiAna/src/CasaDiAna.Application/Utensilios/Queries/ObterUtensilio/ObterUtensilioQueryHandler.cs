using CasaDiAna.Application.Utensilios.Commands.CriarUtensilio;
using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Queries.ObterUtensilio;

public class ObterUtensilioQueryHandler : IRequestHandler<ObterUtensilioQuery, UtensilioDto>
{
    private readonly IUtensilioRepository _utensilios;

    public ObterUtensilioQueryHandler(IUtensilioRepository utensilios) =>
        _utensilios = utensilios;

    public async Task<UtensilioDto> Handle(ObterUtensilioQuery request, CancellationToken cancellationToken)
    {
        var utensilio = await _utensilios.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Utensílio não encontrado.");

        return CriarUtensilioCommandHandler.ToDto(utensilio);
    }
}
