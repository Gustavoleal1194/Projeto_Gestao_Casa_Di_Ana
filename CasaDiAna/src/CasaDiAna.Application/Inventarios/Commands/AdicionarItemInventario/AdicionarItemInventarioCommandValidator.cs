using FluentValidation;

namespace CasaDiAna.Application.Inventarios.Commands.AdicionarItemInventario;

public class AdicionarItemInventarioCommandValidator : AbstractValidator<AdicionarItemInventarioCommand>
{
    public AdicionarItemInventarioCommandValidator()
    {
        RuleFor(x => x.InventarioId)
            .NotEmpty().WithMessage("Inventário é obrigatório.");

        RuleFor(x => x.IngredienteId)
            .NotEmpty().WithMessage("Ingrediente é obrigatório.");

        RuleFor(x => x.QuantidadeContada)
            .GreaterThanOrEqualTo(0).WithMessage("Quantidade contada não pode ser negativa.");
    }
}
