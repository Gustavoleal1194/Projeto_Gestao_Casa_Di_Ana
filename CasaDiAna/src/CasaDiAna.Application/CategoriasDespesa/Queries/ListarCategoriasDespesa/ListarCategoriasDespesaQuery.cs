using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Queries.ListarCategoriasDespesa;

public record ListarCategoriasDespesaQuery(TipoDespesa? Tipo, bool ApenasAtivas = true)
    : IRequest<IReadOnlyList<CategoriaDespesaDto>>;
