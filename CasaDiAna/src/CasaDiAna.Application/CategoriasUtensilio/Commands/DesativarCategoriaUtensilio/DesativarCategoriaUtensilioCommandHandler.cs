using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.DesativarCategoriaUtensilio;

public class DesativarCategoriaUtensilioCommandHandler : IRequestHandler<DesativarCategoriaUtensilioCommand>
{
    private readonly ICategoriaUtensilioRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public DesativarCategoriaUtensilioCommandHandler(
        ICategoriaUtensilioRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task Handle(DesativarCategoriaUtensilioCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        categoria.Desativar(_currentUser.UsuarioId);
        _categorias.Atualizar(categoria);
        await _categorias.SalvarAsync(cancellationToken);
    }
}
