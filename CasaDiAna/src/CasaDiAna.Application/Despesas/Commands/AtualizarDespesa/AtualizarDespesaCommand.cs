using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;

public record AtualizarDespesaCommand(
    Guid Id, DateTime Competencia, TipoDespesa Tipo, CategoriaDespesa Categoria,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento)
    : IRequest<DespesaDto>;
