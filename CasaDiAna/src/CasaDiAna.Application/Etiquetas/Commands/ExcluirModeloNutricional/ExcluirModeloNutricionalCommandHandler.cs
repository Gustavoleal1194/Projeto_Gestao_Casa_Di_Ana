using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.ExcluirModeloNutricional;

public class ExcluirModeloNutricionalCommandHandler : IRequestHandler<ExcluirModeloNutricionalCommand>
{
    private readonly IModeloEtiquetaNutricionalRepository _modelos;

    public ExcluirModeloNutricionalCommandHandler(IModeloEtiquetaNutricionalRepository modelos)
        => _modelos = modelos;

    public async Task Handle(ExcluirModeloNutricionalCommand request, CancellationToken cancellationToken)
    {
        var modelo = await _modelos.ObterPorProdutoIdAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Modelo nutricional não encontrado.");

        await _modelos.RemoverAsync(modelo, cancellationToken);
        await _modelos.SalvarAsync(cancellationToken);
    }
}
