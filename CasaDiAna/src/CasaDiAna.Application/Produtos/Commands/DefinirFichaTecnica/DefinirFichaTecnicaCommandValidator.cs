using FluentValidation;

namespace CasaDiAna.Application.Produtos.Commands.DefinirFichaTecnica;

public class DefinirFichaTecnicaCommandValidator : AbstractValidator<DefinirFichaTecnicaCommand>
{
    public DefinirFichaTecnicaCommandValidator()
    {
        RuleFor(x => x.Itens)
            .NotEmpty().WithMessage("A ficha técnica deve ter pelo menos um ingrediente.");

        RuleForEach(x => x.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.IngredienteId)
                .NotEmpty().WithMessage("Ingrediente é obrigatório.");

            item.RuleFor(i => i.QuantidadePorUnidade)
                .GreaterThan(0).WithMessage("Quantidade por unidade deve ser maior que zero.");
        });
    }
}
