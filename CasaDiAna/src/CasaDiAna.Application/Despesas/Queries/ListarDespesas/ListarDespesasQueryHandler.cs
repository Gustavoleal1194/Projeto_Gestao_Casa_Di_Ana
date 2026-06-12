using CasaDiAna.Application.Despesas.Commands.CriarDespesa;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Queries.ListarDespesas;

public class ListarDespesasQueryHandler : IRequestHandler<ListarDespesasQuery, DespesasMesDto>
{
    private readonly IDespesaRepository _repo;

    public ListarDespesasQueryHandler(IDespesaRepository repo) => _repo = repo;

    public async Task<DespesasMesDto> Handle(ListarDespesasQuery request, CancellationToken cancellationToken)
    {
        var competencia = Despesa.NormalizarCompetencia(request.Competencia);
        var todas = await _repo.ListarPorCompetenciaAsync(competencia, cancellationToken);

        var totalFixas = todas.Where(d => d.Categoria!.Tipo == TipoDespesa.Fixa).Sum(d => d.Valor);
        var totalVariaveis = todas.Where(d => d.Categoria!.Tipo == TipoDespesa.Variavel).Sum(d => d.Valor);

        var doTipo = request.Tipo.HasValue
            ? todas.Where(d => d.Categoria!.Tipo == request.Tipo.Value).ToList()
            : todas.ToList();

        var itens = doTipo.Select(d => CriarDespesaCommandHandler.ToDto(d, d.Categoria!)).ToList();
        var porCategoria = doTipo
            .GroupBy(d => new { d.CategoriaDespesaId, d.Categoria!.Nome })
            .Select(g => new TotalCategoriaDto(g.Key.CategoriaDespesaId, g.Key.Nome, g.Sum(d => d.Valor)))
            .OrderBy(c => c.CategoriaNome)
            .ToList();

        return new DespesasMesDto(competencia, totalFixas, totalVariaveis, itens, porCategoria);
    }
}
