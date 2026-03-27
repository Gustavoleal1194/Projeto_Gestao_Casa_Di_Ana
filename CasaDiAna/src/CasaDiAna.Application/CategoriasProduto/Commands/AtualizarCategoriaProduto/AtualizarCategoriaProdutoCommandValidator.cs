using FluentValidation;

namespace CasaDiAna.Application.CategoriasProduto.Commands.AtualizarCategoriaProduto;

public class AtualizarCategoriaProdutoCommandValidator : AbstractValidator<AtualizarCategoriaProdutoCommand>
{
    public AtualizarCategoriaProdutoCommandValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
    }
}
