using CasaDiAna.Application.Entradas.Common;
using FluentValidation;

namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public class RegistrarEntradaCommandValidator : AbstractValidator<RegistrarEntradaCommand>
{
    public RegistrarEntradaCommandValidator()
    {
        Include(new CabecalhoEntradaValidator());

        RuleFor(x => x)
            .Must(x => (x.Itens?.Count ?? 0) > 0 || (x.ItensUtensilio?.Count ?? 0) > 0)
            .WithMessage("A entrada deve ter pelo menos um item.");

        RuleForEach(x => x.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.IngredienteId)
                .NotEmpty().WithMessage("Ingrediente é obrigatório.");
            item.RuleFor(i => i.Quantidade)
                .GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.");
            item.RuleFor(i => i.CustoUnitario)
                .GreaterThanOrEqualTo(0).WithMessage("Custo unitário não pode ser negativo.");
        });

        RuleForEach(x => x.ItensUtensilio).ChildRules(item =>
        {
            item.RuleFor(i => i.UtensilioId)
                .NotEmpty().WithMessage("Utensílio é obrigatório.");
            item.RuleFor(i => i.Quantidade)
                .GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.");
            item.RuleFor(i => i.CustoUnitario)
                .GreaterThanOrEqualTo(0).WithMessage("Custo unitário não pode ser negativo.");
        });

        RuleForEach(x => x.DatasVencimentoBoleto).ChildRules(data =>
        {
            data.RuleFor(d => d)
                .GreaterThanOrEqualTo(_ => DateTime.UtcNow.Date)
                .WithMessage("A data de vencimento do boleto deve ser hoje ou no futuro.");
        });
    }
}
