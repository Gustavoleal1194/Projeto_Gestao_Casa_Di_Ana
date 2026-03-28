using FluentValidation;

namespace CasaDiAna.Application.Perdas.Commands.RegistrarPerda;

public class RegistrarPerdaCommandValidator : AbstractValidator<RegistrarPerdaCommand>
{
    public RegistrarPerdaCommandValidator()
    {
        RuleFor(x => x.ProdutoId).NotEmpty().WithMessage("Produto é obrigatório.");
        RuleFor(x => x.Data).NotEmpty().WithMessage("Data é obrigatória.");
        RuleFor(x => x.Quantidade).GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.");
        RuleFor(x => x.Justificativa)
            .NotEmpty().WithMessage("Justificativa é obrigatória.")
            .MaximumLength(500).WithMessage("Justificativa deve ter no máximo 500 caracteres.");
    }
}
