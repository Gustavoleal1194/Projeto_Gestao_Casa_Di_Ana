using CasaDiAna.Application.Common;
using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.CriarDespesaFixa;

public class CriarDespesaFixaCommandHandler : IRequestHandler<CriarDespesaFixaCommand, DespesaFixaDto>
{
    private readonly IDespesaFixaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public CriarDespesaFixaCommandHandler(IDespesaFixaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<DespesaFixaDto> Handle(CriarDespesaFixaCommand request, CancellationToken cancellationToken)
    {
        var despesa = DespesaFixa.Criar(
            request.Competencia,
            request.Categoria,
            request.Descricao,
            request.Valor,
            request.Observacao,
            request.DataLancamento,
            _currentUser.UsuarioId);

        await _repo.AdicionarAsync(despesa, cancellationToken);
        await _repo.SalvarAsync(cancellationToken);

        return ToDto(despesa);
    }

    internal static DespesaFixaDto ToDto(DespesaFixa d) =>
        new(d.Id, d.Competencia, d.Categoria, d.Descricao, d.Valor, d.Observacao, d.DataLancamento, d.Ativo);
}
