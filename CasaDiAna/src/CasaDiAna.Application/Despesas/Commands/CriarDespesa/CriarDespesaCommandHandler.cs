using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CriarDespesa;

public class CriarDespesaCommandHandler : IRequestHandler<CriarDespesaCommand, DespesaDto>
{
    private readonly IDespesaRepository _repo;
    private readonly ICategoriaDespesaRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public CriarDespesaCommandHandler(
        IDespesaRepository repo, ICategoriaDespesaRepository categorias, ICurrentUserService currentUser)
    {
        _repo = repo;
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<DespesaDto> Handle(CriarDespesaCommand request, CancellationToken cancellationToken)
    {
        var categoria = await _categorias.ObterPorIdAsync(request.CategoriaDespesaId, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");
        if (!categoria.Ativo)
            throw new DomainException("Categoria está inativa.");

        var despesa = Despesa.Criar(
            request.Competencia, request.CategoriaDespesaId, request.Descricao,
            request.Valor, request.Observacao, request.DataLancamento, _currentUser.UsuarioId);

        await _repo.AdicionarAsync(despesa, cancellationToken);
        await _repo.SalvarAsync(cancellationToken);
        return ToDto(despesa, categoria);
    }

    internal static DespesaDto ToDto(Despesa d, CategoriaDespesa categoria) =>
        new(d.Id, d.Competencia, d.CategoriaDespesaId, categoria.Nome, categoria.Tipo,
            d.Descricao, d.Valor, d.Observacao, d.DataLancamento, d.Ativo);
}
