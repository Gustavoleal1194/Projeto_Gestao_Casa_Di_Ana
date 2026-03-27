using CasaDiAna.Application.Fornecedores.Dtos;
using MediatR;

namespace CasaDiAna.Application.Fornecedores.Queries.ObterFornecedor;

public record ObterFornecedorQuery(Guid Id) : IRequest<FornecedorDto>;
