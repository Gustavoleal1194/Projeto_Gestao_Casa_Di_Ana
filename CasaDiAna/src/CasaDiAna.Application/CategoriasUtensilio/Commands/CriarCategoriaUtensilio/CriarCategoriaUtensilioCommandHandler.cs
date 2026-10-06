using CasaDiAna.Application.CategoriasUtensilio.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;

public class CriarCategoriaUtensilioCommandHandler : IRequestHandler<CriarCategoriaUtensilioCommand, CategoriaUtensilioDto>
{
    private readonly ICategoriaUtensilioRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public CriarCategoriaUtensilioCommandHandler(
        ICategoriaUtensilioRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<CategoriaUtensilioDto> Handle(CriarCategoriaUtensilioCommand request, CancellationToken cancellationToken)
    {
        if (await _categorias.NomeExisteAsync(request.Nome, ct: cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome}'.");

        var categoria = CategoriaUtensilio.Criar(request.Nome, _currentUser.UsuarioId);
        await _categorias.AdicionarAsync(categoria, cancellationToken);
        await _categorias.SalvarAsync(cancellationToken);

        return ToDto(categoria);
    }

    internal static CategoriaUtensilioDto ToDto(CategoriaUtensilio c) =>
        new(c.Id, c.Nome, c.Ativo, c.CriadoEm, c.AtualizadoEm);
}
