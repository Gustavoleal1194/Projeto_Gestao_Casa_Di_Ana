using CasaDiAna.Application.Entradas.Common;
using FluentValidation;

namespace CasaDiAna.Application.Entradas.Commands.EditarEntrada;

public class EditarEntradaCommandValidator : AbstractValidator<EditarEntradaCommand>
{
    public EditarEntradaCommandValidator()
    {
        Include(new CabecalhoEntradaValidator());

        // Vencimento de boleto não é validado aqui: boletos já existentes podem estar vencidos.
        // A regra "data nova deve ser hoje ou no futuro" fica em EntradaMercadoria.SubstituirBoletos.

        RuleForEach(x => x.CustosItens).SetValidator(new CustoItemInputValidator());
        RuleForEach(x => x.CustosItensUtensilio).SetValidator(new CustoItemInputValidator());

        RuleFor(x => x.CustosItens).Must(SemItensRepetidos)
            .WithMessage("Item repetido na lista de custos.");
        RuleFor(x => x.CustosItensUtensilio).Must(SemItensRepetidos)
            .WithMessage("Item repetido na lista de custos.");
    }

    private static bool SemItensRepetidos(IReadOnlyList<CustoItemInputDto>? custos) =>
        custos is null || custos.Select(c => c.ItemId).Distinct().Count() == custos.Count;

    private sealed class CustoItemInputValidator : AbstractValidator<CustoItemInputDto>
    {
        public CustoItemInputValidator()
        {
            RuleFor(c => c.ItemId)
                .NotEmpty().WithMessage("Item é obrigatório.");
            RuleFor(c => c.CustoUnitario)
                .GreaterThanOrEqualTo(0).WithMessage("Custo unitário não pode ser negativo.");
        }
    }
}
