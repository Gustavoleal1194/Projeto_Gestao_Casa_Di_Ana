using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.CategoriasDespesa.Dtos;

public record CategoriaDespesaDto(Guid Id, string Nome, TipoDespesa Tipo, bool EhFolhaPagamento, bool Ativo);
