using CasaDiAna.Application.Despesas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.ReplicarDespesasFixas;

/// <summary>Repete na competência destino as despesas fixas do mês anterior.</summary>
public record ReplicarDespesasFixasCommand(DateTime CompetenciaDestino) : IRequest<ReplicacaoDespesasDto>;
