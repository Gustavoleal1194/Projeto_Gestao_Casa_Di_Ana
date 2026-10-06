using FluentValidation;

namespace CasaDiAna.Application.CategoriasUtensilio.Commands.CriarCategoriaUtensilio;

public class CriarCategoriaUtensilioCommandValidator : AbstractValidator<CriarCategoriaUtensilioCommand>
{
    public CriarCategoriaUtensilioCommandValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
    }
}
