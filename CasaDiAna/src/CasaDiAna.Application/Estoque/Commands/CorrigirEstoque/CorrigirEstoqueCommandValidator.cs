using FluentValidation;

namespace CasaDiAna.Application.Estoque.Commands.CorrigirEstoque;

public class CorrigirEstoqueCommandValidator : AbstractValidator<CorrigirEstoqueCommand>
{
    public CorrigirEstoqueCommandValidator()
    {
        RuleFor(x => x.Itens).NotEmpty().WithMessage("Informe ao menos um item para corrigir.");
        RuleForEach(x => x.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.IngredienteId).NotEmpty();
            item.RuleFor(i => i.NovaQuantidade)
                .GreaterThanOrEqualTo(0).WithMessage("Quantidade não pode ser negativa.");
        });
    }
}
