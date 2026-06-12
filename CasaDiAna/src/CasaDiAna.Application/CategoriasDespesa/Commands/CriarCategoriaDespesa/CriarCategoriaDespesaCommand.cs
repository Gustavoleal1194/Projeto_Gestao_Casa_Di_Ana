using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;

public record CriarCategoriaDespesaCommand(string Nome, TipoDespesa Tipo, bool EhFolhaPagamento)
    : IRequest<CategoriaDespesaDto>;
