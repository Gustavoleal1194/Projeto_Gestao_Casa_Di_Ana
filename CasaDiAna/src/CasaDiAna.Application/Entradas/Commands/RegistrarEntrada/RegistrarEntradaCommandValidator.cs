using FluentValidation;

namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public class RegistrarEntradaCommandValidator : AbstractValidator<RegistrarEntradaCommand>
{
    public RegistrarEntradaCommandValidator()
    {
        RuleFor(x => x.FornecedorId)
            .NotEmpty().WithMessage("Fornecedor é obrigatório.");

        RuleFor(x => x.DataEntrada)
            .NotEmpty().WithMessage("Data de entrada é obrigatória.");

        RuleFor(x => x.Itens)
            .NotEmpty().WithMessage("A entrada deve ter pelo menos um item.")
            .Must(itens => itens.Count > 0).WithMessage("A entrada deve ter pelo menos um item.");

        RuleForEach(x => x.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.IngredienteId)
                .NotEmpty().WithMessage("Ingrediente é obrigatório.");
            item.RuleFor(i => i.Quantidade)
                .GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.");
            item.RuleFor(i => i.CustoUnitario)
                .GreaterThanOrEqualTo(0).WithMessage("Custo unitário não pode ser negativo.");
        });

        RuleFor(x => x.NumeroNotaFiscal)
            .MaximumLength(60).When(x => x.NumeroNotaFiscal != null)
            .WithMessage("Número da nota fiscal deve ter no máximo 60 caracteres.");

        RuleFor(x => x.RecebidoPor)
            .NotEmpty().WithMessage("Informe quem recebeu os produtos.")
            .MaximumLength(100).WithMessage("Nome de quem recebeu deve ter no máximo 100 caracteres.");

        RuleFor(x => x.DataVencimentoBoleto)
            .NotNull()
            .WithMessage("Informe a data de vencimento do boleto.")
            .GreaterThanOrEqualTo(_ => DateTime.UtcNow.Date)
            .WithMessage("A data de vencimento do boleto deve ser hoje ou no futuro.")
            .When(x => x.TemBoleto);
    }
}
