using CasaDiAna.Application.Fornecedores.Dtos;
using MediatR;

namespace CasaDiAna.Application.Fornecedores.Queries.ListarFornecedores;

public record ListarFornecedoresQuery(bool ApenasAtivos = true) : IRequest<IReadOnlyList<FornecedorDto>>;
