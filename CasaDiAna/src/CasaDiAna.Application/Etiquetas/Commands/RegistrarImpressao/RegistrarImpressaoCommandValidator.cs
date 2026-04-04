using FluentValidation;

namespace CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;

public class RegistrarImpressaoCommandValidator : AbstractValidator<RegistrarImpressaoCommand>
{
    public RegistrarImpressaoCommandValidator()
    {
        RuleFor(x => x.ProdutoId)
            .NotEmpty().WithMessage("Produto é obrigatório.");

        RuleFor(x => x.Quantidade)
            .GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.")
            .LessThanOrEqualTo(500).WithMessage("Quantidade máxima por impressão é 500.");

        RuleFor(x => x.DataProducao)
            .NotEmpty().WithMessage("Data de produção é obrigatória.");
    }
}
