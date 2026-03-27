using FluentValidation;

namespace CasaDiAna.Application.CategoriasProduto.Commands.CriarCategoriaProduto;

public class CriarCategoriaProdutoCommandValidator : AbstractValidator<CriarCategoriaProdutoCommand>
{
    public CriarCategoriaProdutoCommandValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
    }
}
