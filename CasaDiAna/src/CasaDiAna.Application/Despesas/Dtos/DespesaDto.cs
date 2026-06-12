using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.Despesas.Dtos;

public record DespesaDto(
    Guid Id, DateTime Competencia, TipoDespesa Tipo, CategoriaDespesa Categoria,
    string? Descricao, decimal Valor, string? Observacao, DateTime DataLancamento, bool Ativo);
