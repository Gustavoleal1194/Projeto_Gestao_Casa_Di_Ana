using CasaDiAna.Application.Common;
using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.ReplicarDespesasFixas;

/// <summary>
/// Copia as despesas fixas do mês anterior para a competência destino. Idempotente:
/// o que já existe no destino (mesma categoria e descrição) não é duplicado, e
/// categorias desativadas não são repetidas. Os valores podem ser ajustados depois.
/// </summary>
public class ReplicarDespesasFixasCommandHandler
    : IRequestHandler<ReplicarDespesasFixasCommand, ReplicacaoDespesasDto>
{
    private readonly IDespesaRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public ReplicarDespesasFixasCommandHandler(IDespesaRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<ReplicacaoDespesasDto> Handle(
        ReplicarDespesasFixasCommand request, CancellationToken cancellationToken)
    {
        var destino = Despesa.NormalizarCompetencia(request.CompetenciaDestino);
        var origem = destino.AddMonths(-1);

        var fixasOrigem = (await _repo.ListarPorCompetenciaAsync(origem, cancellationToken))
            .Where(EhFixaAtiva).ToList();
        var fixasDestino = (await _repo.ListarPorCompetenciaAsync(destino, cancellationToken))
            .Where(EhFixaAtiva).ToList();

        var aCopiar = fixasOrigem
            .Where(o => !fixasDestino.Any(d => d.EhMesmoLancamentoQue(o)))
            .ToList();

        foreach (var despesa in aCopiar)
            await _repo.AdicionarAsync(despesa.CopiarPara(destino, _currentUser.UsuarioId), cancellationToken);

        if (aCopiar.Count > 0)
            await _repo.SalvarAsync(cancellationToken);

        return new ReplicacaoDespesasDto(origem, destino, aCopiar.Count, fixasOrigem.Count - aCopiar.Count);
    }

    private static bool EhFixaAtiva(Despesa d) =>
        d.Categoria is { Tipo: TipoDespesa.Fixa, Ativo: true };
}
