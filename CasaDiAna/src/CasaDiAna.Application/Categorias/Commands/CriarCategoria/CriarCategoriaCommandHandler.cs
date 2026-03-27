using CasaDiAna.Application.Categorias.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Categorias.Commands.CriarCategoria;

public class CriarCategoriaCommandHandler : IRequestHandler<CriarCategoriaCommand, CategoriaDto>
{
    private readonly ICategoriaIngredienteRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public CriarCategoriaCommandHandler(
        ICategoriaIngredienteRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<CategoriaDto> Handle(CriarCategoriaCommand request, CancellationToken cancellationToken)
    {
        if (await _categorias.NomeExisteAsync(request.Nome, ct: cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome}'.");

        var categoria = CategoriaIngrediente.Criar(request.Nome, _currentUser.UsuarioId);
        await _categorias.AdicionarAsync(categoria, cancellationToken);
        await _categorias.SalvarAsync(cancellationToken);

        return new CategoriaDto(categoria.Id, categoria.Nome, categoria.Ativo, categoria.CriadoEm, categoria.AtualizadoEm);
    }
}
