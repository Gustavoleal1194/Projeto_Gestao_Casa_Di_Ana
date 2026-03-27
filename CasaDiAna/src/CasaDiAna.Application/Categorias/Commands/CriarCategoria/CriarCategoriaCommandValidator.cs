using FluentValidation;

namespace CasaDiAna.Application.Categorias.Commands.CriarCategoria;

public class CriarCategoriaCommandValidator : AbstractValidator<CriarCategoriaCommand>
{
    public CriarCategoriaCommandValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
    }
}
