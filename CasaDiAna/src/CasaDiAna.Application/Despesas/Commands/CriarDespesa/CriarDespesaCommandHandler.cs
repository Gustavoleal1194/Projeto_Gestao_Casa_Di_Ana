using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CriarDespesa;

public class CriarDespesaCommandHandler : IRequestHandler<CriarDespesaCommand, DespesaDto>
{
    private readonly IDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CriarDespesaCommandHandler(IDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<DespesaDto> Handle(CriarDespesaCommand request, CancellationToken cancellationToken)
    {
        var despesa = Despesa.Criar(
            request.Competencia, request.Tipo, request.Categoria, request.Descricao,
            request.Valor, request.Observacao, request.DataLancamento, _currentUser.UsuarioId);

        await _repo.AdicionarAsync(despesa, cancellationToken);
        await _repo.SalvarAsync(cancellationToken);
        return ToDto(despesa);
    }

    internal static DespesaDto ToDto(Despesa d) =>
        new(d.Id, d.Competencia, d.Tipo, d.Categoria, d.Descricao, d.Valor, d.Observacao, d.DataLancamento, d.Ativo);
}
