using FluentValidation;

namespace CasaDiAna.Application.Fornecedores.Commands.AtualizarFornecedor;

public class AtualizarFornecedorCommandValidator : AbstractValidator<AtualizarFornecedorCommand>
{
    public AtualizarFornecedorCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id é obrigatório.");

        RuleFor(x => x.RazaoSocial)
            .NotEmpty().WithMessage("Razão social é obrigatória.")
            .MaximumLength(200).WithMessage("Razão social deve ter no máximo 200 caracteres.");

        RuleFor(x => x.NomeFantasia)
            .MaximumLength(200).When(x => x.NomeFantasia != null)
            .WithMessage("Nome fantasia deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Cnpj)
            .Matches(@"^\d{14}$").When(x => x.Cnpj != null)
            .WithMessage("CNPJ deve conter exatamente 14 dígitos numéricos.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => x.Email != null)
            .WithMessage("E-mail inválido.");

        RuleFor(x => x.Telefone)
            .Matches(@"^\d{10,11}$").When(x => x.Telefone != null)
            .WithMessage("Telefone deve conter DDD + número (10 ou 11 dígitos numéricos).");
    }
}
