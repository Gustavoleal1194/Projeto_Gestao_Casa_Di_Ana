using CasaDiAna.Application.Etiquetas.Commands.SalvarModeloNutricional;
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.RenomearModeloNutricional;

public class RenomearModeloNutricionalCommandHandler
    : IRequestHandler<RenomearModeloNutricionalCommand, ModeloEtiquetaNutricionalDto>
{
    private readonly IModeloEtiquetaNutricionalRepository _modelos;

    public RenomearModeloNutricionalCommandHandler(IModeloEtiquetaNutricionalRepository modelos)
        => _modelos = modelos;

    public async Task<ModeloEtiquetaNutricionalDto> Handle(
        RenomearModeloNutricionalCommand request,
        CancellationToken cancellationToken)
    {
        var modelo = await _modelos.ObterPorProdutoIdAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Modelo nutricional não encontrado.");

        modelo.AtualizarNome(request.Nome);
        await _modelos.SalvarAsync(cancellationToken);
        return SalvarModeloNutricionalCommandHandler.ToDto(modelo);
    }
}
