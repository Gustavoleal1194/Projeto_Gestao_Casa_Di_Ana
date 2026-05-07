using FluentValidation;

namespace CasaDiAna.Application.Ingredientes.Commands.CriarIngrediente;

public class CriarIngredienteCommandValidator : AbstractValidator<CriarIngredienteCommand>
{
    public CriarIngredienteCommandValidator()
    {
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
    }
}
