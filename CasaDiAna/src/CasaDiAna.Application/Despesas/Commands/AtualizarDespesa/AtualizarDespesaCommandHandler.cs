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
    private readonly ICurrentUserService _currentUser;

    public AtualizarDespesaCommandHandler(IDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<DespesaDto> Handle(AtualizarDespesaCommand request, CancellationToken cancellationToken)
    {
        var despesa = await _repo.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Despesa não encontrada.");

        despesa.Atualizar(
            request.Competencia, request.Tipo, request.Categoria, request.Descricao,
            request.Valor, request.Observacao, request.DataLancamento, _currentUser.UsuarioId);

        _repo.Atualizar(despesa);
        await _repo.SalvarAsync(cancellationToken);
        return CriarDespesaCommandHandler.ToDto(despesa);
    }
}
