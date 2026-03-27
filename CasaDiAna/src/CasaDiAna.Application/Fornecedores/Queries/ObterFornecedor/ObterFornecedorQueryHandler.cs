using CasaDiAna.Application.Fornecedores.Commands.CriarFornecedor;
using CasaDiAna.Application.Fornecedores.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Fornecedores.Queries.ObterFornecedor;

public class ObterFornecedorQueryHandler : IRequestHandler<ObterFornecedorQuery, FornecedorDto>
{
    private readonly IFornecedorRepository _fornecedores;

    public ObterFornecedorQueryHandler(IFornecedorRepository fornecedores) =>
        _fornecedores = fornecedores;

    public async Task<FornecedorDto> Handle(ObterFornecedorQuery request, CancellationToken cancellationToken)
    {
        var fornecedor = await _fornecedores.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Fornecedor não encontrado.");

        return CriarFornecedorCommandHandler.ToDto(fornecedor);
    }
}
