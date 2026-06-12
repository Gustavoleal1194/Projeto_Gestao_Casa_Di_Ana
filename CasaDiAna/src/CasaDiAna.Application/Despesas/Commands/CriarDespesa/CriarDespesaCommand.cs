using CasaDiAna.Application.Despesas.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.Despesas.Commands.CriarDespesa;

public record CriarDespesaCommand(
    DateTime Competencia, TipoDespesa Tipo, CategoriaDespesa Categoria,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento)
    : IRequest<DespesaDto>;
