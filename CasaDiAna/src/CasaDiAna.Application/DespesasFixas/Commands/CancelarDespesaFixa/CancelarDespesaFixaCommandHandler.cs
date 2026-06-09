using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.CancelarDespesaFixa;

public class CancelarDespesaFixaCommandHandler : IRequestHandler<CancelarDespesaFixaCommand>
{
    private readonly IDespesaFixaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CancelarDespesaFixaCommandHandler(IDespesaFixaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task Handle(CancelarDespesaFixaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");

        despesa.Cancelar(_currentUser.UsuarioId);
        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);
    }
}
