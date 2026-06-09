using CasaDiAna.Application.Common;
using CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;

public class AtualizarDespesaFixaCommandHandler : IRequestHandler<AtualizarDespesaFixaCommand, DespesaFixaDto>
{
    private readonly IDespesaFixaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public AtualizarDespesaFixaCommandHandler(IDespesaFixaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<DespesaFixaDto> Handle(AtualizarDespesaFixaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");

        despesa.Atualizar(
            request.Competencia,
            request.Categoria,
            request.Descricao,
            request.Valor,
            request.Observacao,
            request.DataLancamento,
            _currentUser.UsuarioId);

        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);

        return CriarDespesaFixaCommandHandler.ToDto(despesa);
    }
}
