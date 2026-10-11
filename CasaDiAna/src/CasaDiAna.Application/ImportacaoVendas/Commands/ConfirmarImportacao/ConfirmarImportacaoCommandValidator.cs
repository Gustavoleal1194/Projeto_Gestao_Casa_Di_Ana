using FluentValidation;

namespace CasaDiAna.Application.ImportacaoVendas.Commands.ConfirmarImportacao;

public class ConfirmarImportacaoCommandValidator
    : AbstractValidator<ConfirmarImportacaoCommand>
{
    public ConfirmarImportacaoCommandValidator()
    {
        RuleFor(x => x.CsvBytes)
            .NotEmpty().WithMessage("Arquivo CSV é obrigatório.");

        RuleFor(x => x.NomeArquivo)
            .NotEmpty().WithMessage("Nome do arquivo é obrigatório.");

        RuleFor(x => x.DataVenda)
            .NotEmpty().WithMessage("Data de venda é obrigatória.")
            .LessThanOrEqualTo(DateTime.Today.AddDays(1))
            .WithMessage("Data de venda não pode ser no futuro.");

        RuleForEach(x => x.Vinculos).ChildRules(v =>
        {
            v.RuleFor(i => i.NomeRelatorio)
                .NotEmpty().WithMessage("Nome da linha é obrigatório em cada vínculo.");
            v.RuleFor(i => i.ProdutoId)
                .NotEmpty().WithMessage("Produto é obrigatório em cada vínculo.");
        });
    }
}
