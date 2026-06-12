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

        var totalFixas = todas.Where(d => d.Tipo == TipoDespesa.Fixa).Sum(d => d.Valor);
        var totalVariaveis = todas.Where(d => d.Tipo == TipoDespesa.Variavel).Sum(d => d.Valor);

        var doTipo = request.Tipo.HasValue ? todas.Where(d => d.Tipo == request.Tipo.Value).ToList() : todas.ToList();

        var itens = doTipo.Select(CriarDespesaCommandHandler.ToDto).ToList();
        var porCategoria = doTipo
            .GroupBy(d => d.Categoria)
            .Select(g => new TotalCategoriaDto(g.Key, g.Sum(d => d.Valor)))
            .OrderBy(c => c.Categoria)
            .ToList();

        return new DespesasMesDto(competencia, totalFixas, totalVariaveis, itens, porCategoria);
    }
}
