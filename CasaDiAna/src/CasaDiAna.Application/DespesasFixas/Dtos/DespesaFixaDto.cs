using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.DespesasFixas.Dtos;

public record DespesaFixaDto(
    Guid Id,
    DateTime Competencia,
    CategoriaDespesaFixa Categoria,
    string? Descricao,
    decimal Valor,
    string? Observacao,
    DateTime DataLancamento,
    bool Ativo);
