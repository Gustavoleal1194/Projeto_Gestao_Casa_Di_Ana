using CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;
using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.AtualizarCategoriaUtensilio;

public class AtualizarCategoriaUtensilioCommandHandler : IRequestHandler<AtualizarCategoriaUtensilioCommand, CategoriaUtensilioDto>
{
    private readonly ICategoriaUtensilioRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public AtualizarCategoriaUtensilioCommandHandler(
        ICategoriaUtensilioRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<CategoriaUtensilioDto> Handle(AtualizarCategoriaUtensilioCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        if (await _categorias.NomeExisteAsync(request.Nome, ignorarId: request.Id, ct: cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome}'.");

        categoria.Atualizar(request.Nome, _currentUser.UsuarioId);
        _categorias.Atualizar(categoria);
        await _categorias.SalvarAsync(cancellationToken);

        return CriarCategoriaUtensilioCommandHandler.ToDto(categoria);
    }
}
