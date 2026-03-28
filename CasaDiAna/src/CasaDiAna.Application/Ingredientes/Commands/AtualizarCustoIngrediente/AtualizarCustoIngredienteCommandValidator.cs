using FluentValidation;

namespace CasaDiAna.Application.Ingredientes.Commands.AtualizarCustoIngrediente;

public class AtualizarCustoIngredienteCommandValidator
    : AbstractValidator<AtualizarCustoIngredienteCommand>
{
    public AtualizarCustoIngredienteCommandValidator()
    {
        RuleFor(x => x.CustoUnitario)
            .GreaterThanOrEqualTo(0).When(x => x.CustoUnitario.HasValue)
            .WithMessage("Custo unitário não pode ser negativo.");
    }
}
