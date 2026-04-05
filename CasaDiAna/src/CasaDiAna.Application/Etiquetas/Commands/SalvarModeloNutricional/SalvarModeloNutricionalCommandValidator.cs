using FluentValidation;

namespace CasaDiAna.Application.Etiquetas.Commands.SalvarModeloNutricional;

public class SalvarModeloNutricionalCommandValidator : AbstractValidator<SalvarModeloNutricionalCommand>
{
    public SalvarModeloNutricionalCommandValidator()
    {
        RuleFor(x => x.ProdutoId).NotEmpty().WithMessage("Produto é obrigatório.");
        RuleFor(x => x.Porcao).NotEmpty().MaximumLength(50).WithMessage("Porção é obrigatória (máx. 50 caracteres).");
        RuleFor(x => x.ValorEnergeticoKcal).GreaterThanOrEqualTo(0).WithMessage("Valor energético inválido.");
        RuleFor(x => x.Carboidratos).GreaterThanOrEqualTo(0).WithMessage("Carboidratos inválido.");
        RuleFor(x => x.Proteinas).GreaterThanOrEqualTo(0).WithMessage("Proteínas inválido.");
        RuleFor(x => x.GordurasTotais).GreaterThanOrEqualTo(0).WithMessage("Gorduras totais inválido.");
        RuleFor(x => x.Sodio).GreaterThanOrEqualTo(0).WithMessage("Sódio inválido.");
    }
}
