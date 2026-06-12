using CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Queries.ListarCategoriasDespesa;

public class ListarCategoriasDespesaQueryHandler
    : IRequestHandler<ListarCategoriasDespesaQuery, IReadOnlyList<CategoriaDespesaDto>>
{
    private readonly ICategoriaDespesaRepository _repo;

    public ListarCategoriasDespesaQueryHandler(ICategoriaDespesaRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<CategoriaDespesaDto>> Handle(
        ListarCategoriasDespesaQuery request, CancellationToken cancellationToken)
    {
        var lista = await _repo.ListarAsync(request.Tipo, request.ApenasAtivas, cancellationToken);
        return lista.Select(CriarCategoriaDespesaCommandHandler.ToDto).ToList();
    }
}
