using MediatR;

namespace CasaDiAna.Application.Fornecedores.Commands.DesativarFornecedor;

public record DesativarFornecedorCommand(Guid Id) : IRequest;
