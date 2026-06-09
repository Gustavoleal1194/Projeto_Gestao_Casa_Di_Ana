using CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Queries.ListarDespesasFixas;

public class ListarDespesasFixasQueryHandler
    : IRequestHandler<ListarDespesasFixasQuery, DespesasFixasMesDto>
{
    private readonly IDespesaFixaRepository _repo;

    public ListarDespesasFixasQueryHandler(IDespesaFixaRepository repo) => _repo = repo;

    public async Task<DespesasFixasMesDto> Handle(
        ListarDespesasFixasQuery request, CancellationToken cancellationToken)
    {
        var competencia = DespesaFixa.NormalizarCompetencia(request.Competencia);
        var despesas = await _repo.ListarPorCompetenciaAsync(competencia, cancellationToken);

        var itens = despesas.Select(CriarDespesaFixaCommandHandler.ToDto).ToList();
        var total = despesas.Sum(d => d.Valor);
        var porCategoria = despesas
            .GroupBy(d => d.Categoria)
            .Select(g => new TotalCategoriaDto(g.Key, g.Sum(d => d.Valor)))
            .OrderBy(c => c.Categoria)
            .ToList();

        return new DespesasFixasMesDto(competencia, total, itens, porCategoria);
    }
}
