using CasaDiAna.Application.Fornecedores.Commands.CriarFornecedor;
using CasaDiAna.Application.Fornecedores.Dtos;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Fornecedores.Queries.ListarFornecedores;

public class ListarFornecedoresQueryHandler
    : IRequestHandler<ListarFornecedoresQuery, IReadOnlyList<FornecedorDto>>
{
    private readonly IFornecedorRepository _fornecedores;

    public ListarFornecedoresQueryHandler(IFornecedorRepository fornecedores) =>
        _fornecedores = fornecedores;

    public async Task<IReadOnlyList<FornecedorDto>> Handle(
        ListarFornecedoresQuery request, CancellationToken cancellationToken)
    {
        var lista = await _fornecedores.ListarAsync(request.ApenasAtivos, cancellationToken);
        return lista
            .Select(CriarFornecedorCommandHandler.ToDto)
            .ToList()
            .AsReadOnly();
    }
}
