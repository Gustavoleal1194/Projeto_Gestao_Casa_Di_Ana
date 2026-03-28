using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Commands.AtualizarCustoIngrediente;

public class AtualizarCustoIngredienteCommandHandler
    : IRequestHandler<AtualizarCustoIngredienteCommand>
{
    private readonly IIngredienteRepository _ingredientes;
    private readonly ICurrentUserService _currentUser;

    public AtualizarCustoIngredienteCommandHandler(
        IIngredienteRepository ingredientes,
        ICurrentUserService currentUser)
    {
        _ingredientes = ingredientes;
        _currentUser = currentUser;
    }

    public async Task Handle(
        AtualizarCustoIngredienteCommand request, CancellationToken cancellationToken)
    {
        var ingrediente = await _ingredientes.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Ingrediente não encontrado.");

        ingrediente.AtualizarCusto(request.CustoUnitario, _currentUser.UsuarioId);
        _ingredientes.Atualizar(ingrediente);
        await _ingredientes.SalvarAsync(cancellationToken);
    }
}
