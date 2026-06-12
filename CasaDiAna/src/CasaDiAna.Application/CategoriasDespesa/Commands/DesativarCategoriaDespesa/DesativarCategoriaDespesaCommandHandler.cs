using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.DesativarCategoriaDespesa;

public class DesativarCategoriaDespesaCommandHandler : IRequestHandler<DesativarCategoriaDespesaCommand>
{
    private readonly ICategoriaDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public DesativarCategoriaDespesaCommandHandler(ICategoriaDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarCategoriaDespesaCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");
        categoria.Desativar(_currentUser.UsuarioId);
        _repo.Atualizar(categoria);
        await _repo.SalvarAsync(cancellationToken);
    }
}
