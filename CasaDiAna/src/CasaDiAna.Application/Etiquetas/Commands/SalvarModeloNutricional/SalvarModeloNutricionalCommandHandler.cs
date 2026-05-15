using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.SalvarModeloNutricional;

public class SalvarModeloNutricionalCommandHandler
    : IRequestHandler<SalvarModeloNutricionalCommand, ModeloEtiquetaNutricionalDto>
{
    private readonly IModeloEtiquetaNutricionalRepository _modelos;
    private readonly IProdutoRepository _produtos;

    public SalvarModeloNutricionalCommandHandler(
        IModeloEtiquetaNutricionalRepository modelos,
        IProdutoRepository produtos)
    {
        _modelos = modelos;
        _produtos = produtos;
    }

    public async Task<ModeloEtiquetaNutricionalDto> Handle(
        SalvarModeloNutricionalCommand request,
        CancellationToken cancellationToken)
    {
        if (!await _produtos.ExisteAsync(request.ProdutoId, cancellationToken))
            throw new DomainException("Produto não encontrado.");

        var existente = await _modelos.ObterPorProdutoIdAsync(request.ProdutoId, cancellationToken);

        if (existente is null)
        {
            var novo = ModeloEtiquetaNutricional.Criar(
                request.ProdutoId,
                request.Porcao,
                request.ValorEnergeticoKcal,
                request.ValorEnergeticoKJ,
                request.Carboidratos,
                request.AcucaresTotais,
                request.AcucaresAdicionados,
                request.Proteinas,
                request.GordurasTotais,
                request.GordurasSaturadas,
                request.GordurasTrans,
                request.FibraAlimentar,
                request.Sodio,
                request.PorcoesPorEmbalagem,
                request.MedidaCaseira,
                request.VdValorEnergetico,
                request.VdCarboidratos,
                request.VdAcucaresAdicionados,
                request.VdProteinas,
                request.VdGordurasTotais,
                request.VdGordurasSaturadas,
                request.VdGordurasTrans,
                request.VdFibraAlimentar,
                request.VdSodio,
                request.Nome,
                request.AlergicoAlimentar,
                request.ContemGluten,
                request.ContemLactose,
                request.LoteFabricacao,
                request.Ingredientes);

            await _modelos.AdicionarAsync(novo, cancellationToken);
            await _modelos.SalvarAsync(cancellationToken);
            return ToDto(novo);
        }

        existente.Atualizar(
            request.Porcao,
            request.ValorEnergeticoKcal,
            request.ValorEnergeticoKJ,
            request.Carboidratos,
            request.AcucaresTotais,
            request.AcucaresAdicionados,
            request.Proteinas,
            request.GordurasTotais,
            request.GordurasSaturadas,
            request.GordurasTrans,
            request.FibraAlimentar,
            request.Sodio,
            request.PorcoesPorEmbalagem,
            request.MedidaCaseira,
            request.VdValorEnergetico,
            request.VdCarboidratos,
            request.VdAcucaresAdicionados,
            request.VdProteinas,
            request.VdGordurasTotais,
            request.VdGordurasSaturadas,
            request.VdGordurasTrans,
            request.VdFibraAlimentar,
            request.VdSodio,
            request.Nome,
            request.AlergicoAlimentar,
            request.ContemGluten,
            request.ContemLactose,
            request.LoteFabricacao,
            request.Ingredientes);

        await _modelos.SalvarAsync(cancellationToken);
        return ToDto(existente);
    }

    internal static ModeloEtiquetaNutricionalDto ToDto(ModeloEtiquetaNutricional m) => new(
        m.Id,
        m.ProdutoId,
        m.Porcao,
        m.ValorEnergeticoKcal,
        m.ValorEnergeticoKJ,
        m.Carboidratos,
        m.AcucaresTotais,
        m.AcucaresAdicionados,
        m.Proteinas,
        m.GordurasTotais,
        m.GordurasSaturadas,
        m.GordurasTrans,
        m.FibraAlimentar,
        m.Sodio,
        m.PorcoesPorEmbalagem,
        m.MedidaCaseira,
        m.VdValorEnergetico,
        m.VdCarboidratos,
        m.VdAcucaresAdicionados,
        m.VdProteinas,
        m.VdGordurasTotais,
        m.VdGordurasSaturadas,
        m.VdGordurasTrans,
        m.VdFibraAlimentar,
        m.VdSodio,
        m.Nome,
        m.AlergicoAlimentar,
        m.ContemGluten,
        m.ContemLactose,
        m.LoteFabricacao,
        m.Ingredientes);
}
