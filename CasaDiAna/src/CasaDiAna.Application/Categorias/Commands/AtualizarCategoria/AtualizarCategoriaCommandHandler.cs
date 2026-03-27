using CasaDiAna.Application.Categorias.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Categorias.Commands.AtualizarCategoria;

public class AtualizarCategoriaCommandHandler : IRequestHandler<AtualizarCategoriaCommand, CategoriaDto>
{
    private readonly ICategoriaIngredienteRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public AtualizarCategoriaCommandHandler(
        ICategoriaIngredienteRepository categorias,
        ICurrentUserService currentUser)
    {
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<CategoriaDto> Handle(AtualizarCategoriaCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        if (await _categorias.NomeExisteAsync(request.Nome, ignorarId: request.Id, ct: cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome}'.");

        categoria.Atualizar(request.Nome, _currentUser.UsuarioId);
        _categorias.Atualizar(categoria);
        await _categorias.SalvarAsync(cancellationToken);

        return new CategoriaDto(categoria.Id, categoria.Nome, categoria.Ativo, categoria.CriadoEm, categoria.AtualizadoEm);
    }
}
