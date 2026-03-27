using FluentValidation;

namespace CasaDiAna.Application.Categorias.Commands.AtualizarCategoria;

public class AtualizarCategoriaCommandValidator : AbstractValidator<AtualizarCategoriaCommand>
{
    public AtualizarCategoriaCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id é obrigatório.");

        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
    }
}
