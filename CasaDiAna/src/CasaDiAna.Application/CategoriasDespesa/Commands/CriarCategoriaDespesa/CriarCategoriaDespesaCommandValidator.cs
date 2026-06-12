using FluentValidation;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.CriarCategoriaDespesa;

public class CriarCategoriaDespesaCommandValidator : AbstractValidator<CriarCategoriaDespesaCommand>
{
    public CriarCategoriaDespesaCommandValidator()
    {
        RuleFor(x => x.Nome).NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Tipo).IsInEnum().WithMessage("Tipo inválido.");
    }
}
