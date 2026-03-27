using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Categorias.Commands.DesativarCategoria;

public class DesativarCategoriaCommandHandler : IRequestHandler<DesativarCategoriaCommand>
{
    private readonly ICategoriaIngredienteRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public DesativarCategoriaCommandHandler(
        ICategoriaIngredienteRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarCategoriaCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        categoria.Desativar(_currentUser.UsuarioId);
        _categorias.Atualizar(categoria);
        await _categorias.SalvarAsync(cancellationToken);
    }
}
