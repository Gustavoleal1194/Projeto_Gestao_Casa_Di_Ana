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
        RuleFor(x => x.AcucaresTotais).GreaterThanOrEqualTo(0).WithMessage("Açúcares totais inválido.");
        RuleFor(x => x.AcucaresAdicionados).GreaterThanOrEqualTo(0).WithMessage("Açúcares adicionados inválido.");
        RuleFor(x => x.Proteinas).GreaterThanOrEqualTo(0).WithMessage("Proteínas inválido.");
        RuleFor(x => x.GordurasTotais).GreaterThanOrEqualTo(0).WithMessage("Gorduras totais inválido.");
        RuleFor(x => x.GordurasSaturadas).GreaterThanOrEqualTo(0).WithMessage("Gorduras saturadas inválido.");
        RuleFor(x => x.GordurasTrans).GreaterThanOrEqualTo(0).WithMessage("Gorduras trans inválido.");
        RuleFor(x => x.FibraAlimentar).GreaterThanOrEqualTo(0).WithMessage("Fibra alimentar inválido.");
        RuleFor(x => x.Sodio).GreaterThanOrEqualTo(0).WithMessage("Sódio inválido.");
        RuleFor(x => x.PorcoesPorEmbalagem).GreaterThan(0).When(x => x.PorcoesPorEmbalagem.HasValue).WithMessage("Porções por embalagem deve ser maior que zero.");
        RuleFor(x => x.MedidaCaseira).MaximumLength(100).When(x => x.MedidaCaseira is not null).WithMessage("Medida caseira: máx. 100 caracteres.");
    }
}
