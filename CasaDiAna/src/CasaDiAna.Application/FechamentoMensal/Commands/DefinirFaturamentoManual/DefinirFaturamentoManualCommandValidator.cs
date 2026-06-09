using FluentValidation;

namespace CasaDiAna.Application.FechamentoMensal.Commands.DefinirFaturamentoManual;

public class DefinirFaturamentoManualCommandValidator : AbstractValidator<DefinirFaturamentoManualCommand>
{
    public DefinirFaturamentoManualCommandValidator()
    {
        RuleFor(x => x.Competencia).NotEmpty().WithMessage("Competência é obrigatória.");
        RuleFor(x => x.ValorManual)
            .GreaterThan(0).When(x => x.ValorManual.HasValue)
            .WithMessage("Faturamento manual deve ser maior que zero.");
    }
}
