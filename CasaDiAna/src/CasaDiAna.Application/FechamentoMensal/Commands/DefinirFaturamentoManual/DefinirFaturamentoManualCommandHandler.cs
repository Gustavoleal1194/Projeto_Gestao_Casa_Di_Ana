using CasaDiAna.Application.Common;
using CasaDiAna.Application.FechamentoMensal.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;

public class DefinirFaturamentoManualCommandHandler
    : IRequestHandler<DefinirFaturamentoManualCommand, FaturamentoMensalDto>
{
    private readonly IFaturamentoMensalRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public DefinirFaturamentoManualCommandHandler(
        IFaturamentoMensalRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<FaturamentoMensalDto> Handle(
        DefinirFaturamentoManualCommand request, CancellationToken cancellationToken)
    {
        var competencia = DespesaFixa.NormalizarCompetencia(request.Competencia);
        var existente = await _repo.ObterPorCompetenciaAsync(competencia, cancellationToken);

        if (existente is null)
        {
            existente = FaturamentoMensal.Criar(competencia, request.ValorManual, _currentUser.UsuarioId);
            await _repo.AdicionarAsync(existente, cancellationToken);
        }
        else
        {
            existente.DefinirValor(request.ValorManual, _currentUser.UsuarioId);
            _repo.Atualizar(existente);
        }

        await _repo.SalvarAsync(cancellationToken);
        return new FaturamentoMensalDto(existente.Competencia, existente.ValorManual);
    }
}
