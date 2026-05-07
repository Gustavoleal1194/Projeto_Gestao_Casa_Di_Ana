using FluentValidation;

namespace CasaDiAna.Application.Ingredientes.Commands.AtualizarIngrediente;

public class AtualizarIngredienteCommandValidator : AbstractValidator<AtualizarIngredienteCommand>
{
    public AtualizarIngredienteCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id é obrigatório.");

        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(150).WithMessage("Nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.UnidadeMedidaId)
            .GreaterThan((short)0).WithMessage("Unidade de medida é obrigatória.");

        RuleFor(x => x.EstoqueMinimo)
            .GreaterThanOrEqualTo(0).WithMessage("Estoque mínimo não pode ser negativo.");

        RuleFor(x => x.EstoqueMaximo)
            .GreaterThanOrEqualTo(x => x.EstoqueMinimo)
            .When(x => x.EstoqueMaximo.HasValue)
            .WithMessage("Estoque máximo não pode ser menor que o mínimo.");

        RuleFor(x => x.CodigoInterno)
            .MaximumLength(30).When(x => x.CodigoInterno != null)
            .WithMessage("Código interno deve ter no máximo 30 caracteres.");

        RuleFor(x => x.QuantidadeEmbalagemValor)
            .GreaterThan(0).When(x => x.QuantidadeEmbalagemValor.HasValue)
            .WithMessage("Quantidade por embalagem deve ser maior que 0.");

        RuleFor(x => x.UnidadeEmbalagem)
            .Must(u => u == null || u == "ml" || u == "g")
            .WithMessage("Unidade de embalagem deve ser 'ml' ou 'g'.");

        // Cross-validation: if value is set, unit must also be set
        RuleFor(x => x.UnidadeEmbalagem)
            .NotNull().When(x => x.QuantidadeEmbalagemValor.HasValue)
            .WithMessage("Informe a unidade de embalagem (ml ou g) quando a quantidade for informada.");

        // Cross-validation: if unit is set, value must also be set
        RuleFor(x => x.QuantidadeEmbalagemValor)
            .NotNull().When(x => x.UnidadeEmbalagem != null)
            .WithMessage("Informe a quantidade por embalagem quando a unidade for informada.");
    }
}
