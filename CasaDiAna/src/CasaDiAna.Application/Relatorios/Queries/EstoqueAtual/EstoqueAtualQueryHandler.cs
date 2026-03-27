using CasaDiAna.Application.Relatorios.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.EstoqueAtual;

public class EstoqueAtualQueryHandler : IRequestHandler<EstoqueAtualQuery, IReadOnlyList<EstoqueAtualItemDto>>
{
    private readonly IIngredienteRepository _ingredientes;

    public EstoqueAtualQueryHandler(IIngredienteRepository ingredientes)
    {
        _ingredientes = ingredientes;
    }

    public async Task<IReadOnlyList<EstoqueAtualItemDto>> Handle(
        EstoqueAtualQuery request, CancellationToken cancellationToken)
    {
        var lista = await _ingredientes.ListarAsync(apenasAtivos: true, cancellationToken);

        var resultado = lista.Select(i => new EstoqueAtualItemDto(
            i.Id,
            i.Nome,
            i.Categoria?.Nome,
            i.UnidadeMedida?.Codigo ?? string.Empty,
            i.EstoqueAtual,
            i.EstoqueMinimo,
            i.EstoqueMaximo,
            i.EstaBaixoDoMinimo()));

        if (request.ApenasAbaixoDoMinimo)
            resultado = resultado.Where(i => i.EstaBaixoDoMinimo);

        return resultado.OrderBy(i => i.Nome).ToList().AsReadOnly();
    }
}
