using CasaDiAna.Application.Despesas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CriarDespesa;

public record CriarDespesaCommand(
    DateTime Competencia, Guid CategoriaDespesaId,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento) : IRequest<DespesaDto>;
