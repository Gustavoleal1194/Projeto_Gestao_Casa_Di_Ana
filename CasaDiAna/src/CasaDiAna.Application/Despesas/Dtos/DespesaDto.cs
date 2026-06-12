using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.Despesas.Dtos;

public record DespesaDto(
    Guid Id, DateTime Competencia, Guid CategoriaDespesaId, string CategoriaNome, TipoDespesa Tipo,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento, bool Ativo);
