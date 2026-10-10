using FluentValidation;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

public class ConfirmarImportacaoCommandValidator
    : AbstractValidator<ConfirmarImportacaoCommand>
{
    public ConfirmarImportacaoCommandValidator()
    {
        RuleFor(x => x.Hash)
            .NotEmpty().WithMessage("Hash do arquivo é obrigatório.");

        RuleFor(x => x.NomeArquivo)
            .NotEmpty().WithMessage("Nome do arquivo é obrigatório.");

        RuleFor(x => x.DataVenda)
            .NotEmpty().WithMessage("Data de venda é obrigatória.")
            .LessThanOrEqualTo(DateTime.Today.AddDays(1))
            .WithMessage("Data de venda não pode ser no futuro.");

        RuleFor(x => x)
            .Must(x => x.Itens is { Count: > 0 } || x.TotalTaxaServico > 0 || x.TotalEntregas > 0)
            .WithMessage("Nenhum item ou repasse confirmado para importação.");

        RuleFor(x => x.TotalTaxaServico)
            .GreaterThanOrEqualTo(0).WithMessage("Total de taxa de serviço não pode ser negativo.");

        RuleFor(x => x.TotalEntregas)
            .GreaterThanOrEqualTo(0).WithMessage("Total de entregas não pode ser negativo.");

        RuleForEach(x => x.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.ProdutoId)
                .NotEmpty().WithMessage("ProdutoId é obrigatório em cada item.");
            item.RuleFor(i => i.Quantidade)
                .GreaterThan(0).WithMessage("Quantidade deve ser maior que zero.");
        });
    }
}
