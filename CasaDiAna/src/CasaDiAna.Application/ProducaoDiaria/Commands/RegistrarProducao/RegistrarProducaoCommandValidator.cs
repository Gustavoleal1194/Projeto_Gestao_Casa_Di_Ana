using FluentValidation;

namespace CasaDiAna.Application.ProducaoDiaria.Commands.RegistrarProducao;

public class RegistrarProducaoCommandValidator : AbstractValidator<RegistrarProducaoCommand>
{
    public RegistrarProducaoCommandValidator()
    {
        RuleFor(x => x.ProdutoId)
            .NotEmpty().WithMessage("Produto é obrigatório.");

        RuleFor(x => x.Data)
            .NotEmpty().WithMessage("Data é obrigatória.");

        RuleFor(x => x.QuantidadeProduzida)
            .GreaterThan(0).WithMessage("Quantidade produzida deve ser maior que zero.");
    }
}
