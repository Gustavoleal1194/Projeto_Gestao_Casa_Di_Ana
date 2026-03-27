using CasaDiAna.Application.Relatorios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Relatorios.Queries.Entradas;

public record EntradasRelatorioQuery(
    DateTime De,
    DateTime Ate) : IRequest<EntradaRelatorioResumoDto>;
