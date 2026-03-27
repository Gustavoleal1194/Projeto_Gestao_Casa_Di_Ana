using CasaDiAna.Application.Relatorios.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.Movimentacoes;

public record MovimentacoesQuery(
    DateTime De,
    DateTime Ate,
    TipoMovimentacao? Tipo = null,
    Guid? IngredienteId = null) : IRequest<IReadOnlyList<MovimentacaoRelatorioDto>>;
