using FluentValidation;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.AtualizarCategoriaDespesa;

public class AtualizarCategoriaDespesaCommandValidator : AbstractValidator<AtualizarCategoriaDespesaCommand>
{
    public AtualizarCategoriaDespesaCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Nome).NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Tipo).IsInEnum().WithMessage("Tipo inválido.");
    }
}
