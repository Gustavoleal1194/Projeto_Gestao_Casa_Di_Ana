using CasaDiAna.Application.CategoriasDespesa.Dtos;
using CasaDiAna.Domain.Enums;
using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.AtualizarCategoriaDespesa;

public record AtualizarCategoriaDespesaCommand(Guid Id, string Nome, TipoDespesa Tipo, bool EhFolhaPagamento)
    : IRequest<CategoriaDespesaDto>;
