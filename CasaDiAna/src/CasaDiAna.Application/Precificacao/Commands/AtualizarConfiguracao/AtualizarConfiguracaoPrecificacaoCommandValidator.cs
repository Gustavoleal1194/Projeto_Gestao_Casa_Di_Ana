using FluentValidation;

namespace CasaDiAna.Application.Precificacao.Commands.AtualizarConfiguracao;

public class AtualizarConfiguracaoPrecificacaoCommandValidator
    : AbstractValidator<AtualizarConfiguracaoPrecificacaoCommand>
{
    public AtualizarConfiguracaoPrecificacaoCommandValidator()
    {
        RuleFor(x => x.CmvAlvo).GreaterThan(0).LessThan(1)
            .WithMessage("CMV alvo deve estar entre 0 e 100%.");
        RuleFor(x => x.MargemDesejada).GreaterThanOrEqualTo(0).LessThan(1)
            .WithMessage("Margem desejada deve estar entre 0 e 100%.");
        RuleFor(x => x.Taxas).GreaterThanOrEqualTo(0).LessThan(1)
            .WithMessage("Taxas devem estar entre 0 e 100%.");
    }
}
