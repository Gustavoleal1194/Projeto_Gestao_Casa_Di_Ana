using FluentValidation;

namespace CasaDiAna.Application.Produtos.Commands.DefinirCustoUnitario;

public class DefinirCustoUnitarioCommandValidator : AbstractValidator<DefinirCustoUnitarioCommand>
{
    public DefinirCustoUnitarioCommandValidator()
    {
        RuleFor(x => x.CustoUnitario)
            .GreaterThan(0).WithMessage("Custo unitário deve ser maior que zero.");
    }
}
