using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CancelarDespesa;

public class CancelarDespesaCommandHandler : IRequestHandler<CancelarDespesaCommand>
{
    private readonly IDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CancelarDespesaCommandHandler(IDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task Handle(CancelarDespesaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");
        despesa.Cancelar(_currentUser.UsuarioId);
        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);
    }
}
