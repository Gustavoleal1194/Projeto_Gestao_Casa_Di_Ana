using CasaDiAna.Application.DespesasFixas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;

public record AtualizarDespesaFixaCommand(
    Guid Id,
    DateTime Competencia,
    CategoriaDespesaFixa Categoria,
    string? Descricao,
    decimal Valor,
    string? Observacao,
    DateTime DataLancamento) : IRequest<DespesaFixaDto>;
