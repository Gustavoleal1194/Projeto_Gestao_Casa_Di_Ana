using FluentValidation;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.AtualizarCategoriaUtensilio;

public class AtualizarCategoriaUtensilioCommandValidator : AbstractValidator<AtualizarCategoriaUtensilioCommand>
{
    public AtualizarCategoriaUtensilioCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id é obrigatório.");

        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
    }
}
