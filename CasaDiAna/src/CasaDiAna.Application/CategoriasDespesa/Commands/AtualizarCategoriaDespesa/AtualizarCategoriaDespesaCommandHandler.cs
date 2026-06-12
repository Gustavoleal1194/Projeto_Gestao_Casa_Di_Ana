using CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;
using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.AtualizarCategoriaDespesa;

public class AtualizarCategoriaDespesaCommandHandler : IRequestHandler<AtualizarCategoriaDespesaCommand, CategoriaDespesaDto>
{
    private readonly ICategoriaDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public AtualizarCategoriaDespesaCommandHandler(ICategoriaDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<CategoriaDespesaDto> Handle(AtualizarCategoriaDespesaCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");

        if (await _repo.NomeExisteAsync(request.Nome.Trim(), request.Id, cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome.Trim()}'.");

        categoria.Atualizar(request.Nome, request.Tipo, request.EhFolhaPagamento, _currentUser.UsuarioId);
        _repo.Atualizar(categoria);
        await _repo.SalvarAsync(cancellationToken);
        return CriarCategoriaDespesaCommandHandler.ToDto(categoria);
    }
}
