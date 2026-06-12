using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Commands.CriarDespesa;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;

public class AtualizarDespesaCommandHandler : IRequestHandler<AtualizarDespesaCommand, DespesaDto>
{
    private readonly IDespesaRepository _repo;
    private readonly ICategoriaDespesaRepository _categorias;
    private readonly ICurrentUserService _currentUser;

    public AtualizarDespesaCommandHandler(
        IDespesaRepository repo, ICategoriaDespesaRepository categorias, ICurrentUserService currentUser)
    {
        _repo = repo;
        _categorias = categorias;
        _currentUser = currentUser;
    }

    public async Task<DespesaDto> Handle(AtualizarDespesaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");
        var categoria = await _categorias.ObterPorIdAsync(request.CategoriaDespesaId, cancellationToken)
            ?? throw new DomainException("Categoria não encontrada.");
        if (!categoria.Ativo)
            throw new DomainException("Categoria está inativa.");

        despesa.Atualizar(request.Competencia, request.CategoriaDespesaId, request.Descricao,
            request.Valor, request.Observacao, request.DataLancamento, _currentUser.UsuarioId);
        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);
        return CriarDespesaCommandHandler.ToDto(despesa, categoria);
    }
}
