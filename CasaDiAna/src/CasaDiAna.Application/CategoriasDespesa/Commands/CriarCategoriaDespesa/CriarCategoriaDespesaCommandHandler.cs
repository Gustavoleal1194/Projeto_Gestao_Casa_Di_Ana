using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;
using CategoriaDespesaEntity = CasaDiAna.Domain.Entities.CategoriaDespesa;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;

public class CriarCategoriaDespesaCommandHandler : IRequestHandler<CriarCategoriaDespesaCommand, CategoriaDespesaDto>
{
    private readonly ICategoriaDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CriarCategoriaDespesaCommandHandler(ICategoriaDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<CategoriaDespesaDto> Handle(CriarCategoriaDespesaCommand request, CancellationToken cancellationToken)
    {
        if (await _repo.NomeExisteAsync(request.Nome.Trim(), ct: cancellationToken))
            throw new DomainException($"Já existe uma categoria com o nome '{request.Nome.Trim()}'.");

        var categoria = CategoriaDespesaEntity.Criar(request.Nome, request.Tipo, request.EhFolhaPagamento, _currentUser.UsuarioId);
        await _repo.AdicionarAsync(categoria, cancellationToken);
        await _repo.SalvarAsync(cancellationToken);
        return ToDto(categoria);
    }

    internal static CategoriaDespesaDto ToDto(CategoriaDespesaEntity c) =>
        new(c.Id, c.Nome, c.Tipo, c.EhFolhaPagamento, c.Ativo);
}
