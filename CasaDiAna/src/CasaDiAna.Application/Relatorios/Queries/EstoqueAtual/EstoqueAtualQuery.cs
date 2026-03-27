using CasaDiAna.Application.Relatorios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.EstoqueAtual;

public record EstoqueAtualQuery(bool ApenasAbaixoDoMinimo = false)
    : IRequest<IReadOnlyList<EstoqueAtualItemDto>>;
