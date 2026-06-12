using CasaDiAna.Application.Despesas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.AtualizarDespesa;

public record AtualizarDespesaCommand(
    Guid Id, DateTime Competencia, Guid CategoriaDespesaId,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento) : IRequest<DespesaDto>;
