using FluentValidation;

namespace CasaDiAna.Application.DespesasFixas.Commands.AtualizarDespesaFixa;

public class AtualizarDespesaFixaCommandValidator : AbstractValidator<AtualizarDespesaFixaCommand>
{
    public AtualizarDespesaFixaCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id é obrigatório.");
        RuleFor(x => x.Competencia).NotEmpty().WithMessage("Competência é obrigatória.");
        RuleFor(x => x.Categoria).IsInEnum().WithMessage("Categoria inválida.");
        RuleFor(x => x.Valor).GreaterThan(0).WithMessage("Valor deve ser maior que zero.");
        RuleFor(x => x.DataLancamento).NotEmpty().WithMessage("Data de lançamento é obrigatória.");
        RuleFor(x => x.Descricao).MaximumLength(200).WithMessage("Descrição deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Observacao).MaximumLength(500).WithMessage("Observação deve ter no máximo 500 caracteres.");
    }
}
