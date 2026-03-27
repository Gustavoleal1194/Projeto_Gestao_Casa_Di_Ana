using CasaDiAna.Application.Ingredientes.Commands.CriarIngrediente;
using CasaDiAna.Application.Ingredientes.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Queries.ObterIngrediente;

public class ObterIngredienteQueryHandler : IRequestHandler<ObterIngredienteQuery, IngredienteDto>
{
    private readonly IIngredienteRepository _ingredientes;

    public ObterIngredienteQueryHandler(IIngredienteRepository ingredientes) =>
        _ingredientes = ingredientes;

    public async Task<IngredienteDto> Handle(ObterIngredienteQuery request, CancellationToken cancellationToken)
    {
        var ingrediente = await _ingredientes.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Ingrediente não encontrado.");

        return CriarIngredienteCommandHandler.ToDto(ingrediente);
    }
}
