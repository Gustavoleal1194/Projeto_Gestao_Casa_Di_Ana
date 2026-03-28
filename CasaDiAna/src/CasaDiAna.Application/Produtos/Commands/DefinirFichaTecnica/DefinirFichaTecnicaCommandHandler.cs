using CasaDiAna.Application.Produtos.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.DefinirFichaTecnica;

public class DefinirFichaTecnicaCommandHandler
    : IRequestHandler<DefinirFichaTecnicaCommand, FichaTecnicaDto>
{
    private readonly IProdutoRepository _produtos;
    private readonly IIngredienteRepository _ingredientes;

    public DefinirFichaTecnicaCommandHandler(
        IProdutoRepository produtos,
        IIngredienteRepository ingredientes)
    {
        _produtos = produtos;
        _ingredientes = ingredientes;
    }

    public async Task<FichaTecnicaDto> Handle(
        DefinirFichaTecnicaCommand request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdComFichaAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        // Valida que todos os ingredientes informados existem
        var idsIngredientes = request.Itens.Select(i => i.IngredienteId).Distinct().ToList();
        var ingredientesEncontrados = (await _ingredientes.ListarAsync(apenasAtivos: false, cancellationToken))
            .Where(i => idsIngredientes.Contains(i.Id))
            .ToDictionary(i => i.Id);

        var naoEncontrados = idsIngredientes.Where(id => !ingredientesEncontrados.ContainsKey(id)).ToList();
        if (naoEncontrados.Any())
            throw new DomainException("Um ou mais ingredientes informados não foram encontrados.");

        // Aplica a ficha técnica na entidade (limpa e reconstrói em memória)
        produto.DefinirFichaTecnica(
            request.Itens.Select(i => (i.IngredienteId, i.QuantidadePorUnidade)));

        // Persiste: deleta os itens antigos e insere os novos diretamente
        await _produtos.SubstituirItensFichaAsync(produto, cancellationToken);
        await _produtos.SalvarAsync(cancellationToken);

        // Recarrega para ter os ingredientes com custo preenchido
        var atualizado = await _produtos.ObterPorIdComFichaAsync(produto.Id, cancellationToken);
        return ToFichaTecnicaDto(atualizado!);
    }

    internal static FichaTecnicaDto ToFichaTecnicaDto(Domain.Entities.Produto p)
    {
        var itens = p.ItensFicha.Select(i => new ItemFichaTecnicaDto(
            i.IngredienteId,
            i.Ingrediente?.Nome ?? string.Empty,
            i.Ingrediente?.UnidadeMedida?.Codigo ?? string.Empty,
            i.QuantidadePorUnidade,
            i.Ingrediente?.CustoUnitario,
            i.QuantidadePorUnidade * (i.Ingrediente?.CustoUnitario ?? 0)
        )).ToList().AsReadOnly();

        var custoTotal = itens.Sum(i => i.CustoItem);
        var margem = p.PrecoVenda > 0
            ? ((p.PrecoVenda - custoTotal) / p.PrecoVenda) * 100
            : (decimal?)null;

        return new FichaTecnicaDto(p.Id, p.Nome, p.PrecoVenda, itens, custoTotal, margem);
    }
}
