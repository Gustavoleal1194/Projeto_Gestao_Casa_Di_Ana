using FluentValidation;

namespace CasaDiAna.Application.VendasDiarias.Commands.RegistrarVenda;

public class RegistrarVendaCommandValidator : AbstractValidator<RegistrarVendaCommand>
{
    public RegistrarVendaCommandValidator()
    {
        RuleFor(x => x.ProdutoId)
            .NotEmpty().WithMessage("Produto é obrigatório.");

        RuleFor(x => x.Data)
            .NotEmpty().WithMessage("Data é obrigatória.");

        RuleFor(x => x.QuantidadeVendida)
            .GreaterThan(0).WithMessage("Quantidade vendida deve ser maior que zero.");
    }
}
