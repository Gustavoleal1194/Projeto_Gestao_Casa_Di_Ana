using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Fornecedores.Commands.DesativarFornecedor;

public class DesativarFornecedorCommandHandler : IRequestHandler<DesativarFornecedorCommand>
{
    private readonly IFornecedorRepository _fornecedores;
    private readonly ICurrentUserService _currentUser;

    public DesativarFornecedorCommandHandler(
        IFornecedorRepository fornecedores,
        ICurrentUserService currentUser)
    {
        _fornecedores = fornecedores;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarFornecedorCommand request, CancellationToken cancellationToken)
    {
        var fornecedor = await _fornecedores.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Fornecedor não encontrado.");

        fornecedor.Desativar(_currentUser.UsuarioId);
        _fornecedores.Atualizar(fornecedor);
        await _fornecedores.SalvarAsync(cancellationToken);
    }
}
