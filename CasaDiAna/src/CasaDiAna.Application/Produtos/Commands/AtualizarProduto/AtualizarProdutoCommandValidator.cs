using FluentValidation;

namespace CasaDiAna.Application.Produtos.Commands.AtualizarProduto;

public class AtualizarProdutoCommandValidator : AbstractValidator<AtualizarProdutoCommand>
{
    public AtualizarProdutoCommandValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(150).WithMessage("Nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.PrecoVenda)
            .GreaterThan(0).WithMessage("Preço de venda deve ser maior que zero.");

        RuleFor(x => x.Descricao)
            .MaximumLength(500).When(x => x.Descricao != null)
            .WithMessage("Descrição deve ter no máximo 500 caracteres.");
    }
}
