using FluentValidation;

namespace CasaDiAna.Application.FechamentoMensal.Commands.AtualizarConfiguracaoRepasse;

public class AtualizarConfiguracaoRepasseCommandValidator
    : AbstractValidator<AtualizarConfiguracaoRepasseCommand>
{
    public AtualizarConfiguracaoRepasseCommandValidator()
    {
        RuleFor(x => x.PercentualRetencaoCasa)
            .GreaterThanOrEqualTo(0).WithMessage("Retenção da casa não pode ser negativa.")
            .LessThan(1).WithMessage("Retenção da casa deve ser menor que 100%.");
        RuleFor(x => x.PercentualTaxaCartao)
            .GreaterThanOrEqualTo(0).WithMessage("Taxa do cartão não pode ser negativa.")
            .LessThan(1).WithMessage("Taxa do cartão deve ser menor que 100%.");
        RuleFor(x => x)
            .Must(x => x.PercentualRetencaoCasa + x.PercentualTaxaCartao < 1)
            .WithMessage("A soma da retenção da casa com a taxa do cartão deve ser menor que 100%.");
    }
}
