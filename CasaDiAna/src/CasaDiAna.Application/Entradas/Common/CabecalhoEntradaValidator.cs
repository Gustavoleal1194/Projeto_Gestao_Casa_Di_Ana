using FluentValidation;

namespace CasaDiAna.Application.Entradas.Common;

internal sealed class CabecalhoEntradaValidator : AbstractValidator<ICabecalhoEntrada>
{
    public CabecalhoEntradaValidator()
    {
        RuleFor(x => x.FornecedorId)
            .NotEmpty().WithMessage("Fornecedor é obrigatório.");

        RuleFor(x => x.DataEntrada)
            .NotEmpty().WithMessage("Data de entrada é obrigatória.");

        RuleFor(x => x.NumeroNotaFiscal)
            .MaximumLength(60).When(x => x.NumeroNotaFiscal != null)
            .WithMessage("Número da nota fiscal deve ter no máximo 60 caracteres.");

        RuleFor(x => x.RecebidoPor)
            .NotEmpty().WithMessage("Informe quem recebeu os produtos.")
            .MaximumLength(100).WithMessage("Nome de quem recebeu deve ter no máximo 100 caracteres.");
    }
}
