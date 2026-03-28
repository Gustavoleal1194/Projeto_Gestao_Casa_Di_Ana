using CasaDiAna.Application.ProducaoDiaria.Dtos;
using MediatR;

namespace CasaDiAna.Application.ProducaoDiaria.Commands.RegistrarProducao;

public record RegistrarProducaoCommand(
    Guid ProdutoId,
    DateTime Data,
    decimal QuantidadeProduzida,
    string? Observacoes = null) : IRequest<ProducaoDiariaDto>;
