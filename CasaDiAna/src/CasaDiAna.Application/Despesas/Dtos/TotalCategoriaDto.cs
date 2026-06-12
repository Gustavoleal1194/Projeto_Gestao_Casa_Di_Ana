using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Application.Despesas.Dtos;

public record TotalCategoriaDto(CategoriaDespesa Categoria, decimal Total);
