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

        RuleFor(x => x.QuantidadeEmbalagem)
            .MaximumLength(100).When(x => x.QuantidadeEmbalagem != null)
            .WithMessage("Quantidade por embalagem deve ter no máximo 100 caracteres.");
    }
}
