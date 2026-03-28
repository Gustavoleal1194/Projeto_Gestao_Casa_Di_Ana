using CasaDiAna.Application.ProducaoDiaria.Commands.RegistrarProducao;
using CasaDiAna.Application.ProducaoDiaria.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.ProducaoDiaria.Queries.ListarProducao;

public class ListarProducaoQueryHandler
    : IRequestHandler<ListarProducaoQuery, IReadOnlyList<ProducaoDiariaDto>>
{
    private readonly IProducaoDiariaRepository _producoes;

    public ListarProducaoQueryHandler(IProducaoDiariaRepository producoes) =>
        _producoes = producoes;

    public async Task<IReadOnlyList<ProducaoDiariaDto>> Handle(
        ListarProducaoQuery request, CancellationToken cancellationToken)
    {
        var lista = await _producoes.ListarAsync(
            request.De, request.Ate, request.ProdutoId, cancellationToken);

        return lista
            .Select(p => RegistrarProducaoCommandHandler.ToDto(p, p.Produto?.Nome ?? string.Empty))
            .ToList()
            .AsReadOnly();
    }
}
