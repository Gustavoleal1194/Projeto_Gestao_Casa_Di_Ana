using CasaDiAna.Application.Utensilios.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Utensilios.Queries.ListarUtensilios;

public class ListarUtensiliosQueryHandler
    : IRequestHandler<ListarUtensiliosQuery, IReadOnlyList<UtensilioResumoDto>>
{
    private readonly IUtensilioRepository _utensilios;

    public ListarUtensiliosQueryHandler(IUtensilioRepository utensilios) =>
        _utensilios = utensilios;

    public async Task<IReadOnlyList<UtensilioResumoDto>> Handle(
        ListarUtensiliosQuery request, CancellationToken cancellationToken)
    {
        var lista = await _utensilios.ListarAsync(request.ApenasAtivos, cancellationToken);
        return lista
            .Select(u => new UtensilioResumoDto(
                u.Id, u.Nome, u.CodigoInterno,
                u.Categoria?.Nome,
                u.UnidadeMedida?.Codigo ?? string.Empty,
                u.EstoqueAtual, u.EstoqueMinimo,
                u.EstaBaixoDoMinimo(), u.Ativo))
            .ToList()
            .AsReadOnly();
    }
}
