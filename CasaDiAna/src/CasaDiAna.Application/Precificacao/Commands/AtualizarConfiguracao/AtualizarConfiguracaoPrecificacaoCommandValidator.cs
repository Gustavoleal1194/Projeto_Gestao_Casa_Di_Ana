using FluentValidation;

namespace CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;

public class AtualizarConfiguracaoPrecificacaoCommandValidator
    : AbstractValidator<AtualizarConfiguracaoPrecificacaoCommand>
{
    public AtualizarConfiguracaoPrecificacaoCommandValidator()
    {
        RuleFor(x => x.CmvAlvo)
            .GreaterThan(0).WithMessage("CMV alvo deve ser maior que 0%.")
            .LessThan(1).WithMessage("CMV alvo deve ser menor que 100%.");
        RuleFor(x => x.MargemDesejada)
            .GreaterThanOrEqualTo(0).WithMessage("Margem desejada não pode ser negativa.")
            .LessThan(1).WithMessage("Margem desejada deve ser menor que 100%.");
        RuleFor(x => x.Taxas)
            .GreaterThanOrEqualTo(0).WithMessage("Taxas não podem ser negativas.")
            .LessThan(1).WithMessage("Taxas devem ser menores que 100%.");
    }
}
