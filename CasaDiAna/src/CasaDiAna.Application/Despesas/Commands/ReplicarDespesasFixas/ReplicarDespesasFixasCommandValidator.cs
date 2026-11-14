using FluentValidation;

namespace CasaDiAna.Application.Despesas.Commands.ReplicarDespesasFixas;

public class ReplicarDespesasFixasCommandValidator : AbstractValidator<ReplicarDespesasFixasCommand>
{
    public ReplicarDespesasFixasCommandValidator()
    {
        RuleFor(x => x.CompetenciaDestino).NotEmpty().WithMessage("Competência é obrigatória.");
    }
}
